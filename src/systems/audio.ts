type SoundName = 'shoot' | 'hit' | 'explode' | 'powerup' | 'life' | 'gameover' | 'combo' | 'menu_click' | 'menu_back' | 'phase_up';

import { getQualitySettings } from '../core/quality.js';

export class SoundManager {
  private ctx: AudioContext | null = null;
  private dryGain: GainNode | null = null;
  private wetGain: GainNode | null = null;
  private reverb: ConvolverNode | null = null;
  private enabled = true;
  private activeSounds = 0;
  private maxPolyphony = 8;
  private noiseBuffer: AudioBuffer | null = null;

  private getContext(): AudioContext | null {
    if (this.ctx) return this.ctx;
    try {
      this.ctx = new AudioContext();
      this.dryGain = this.ctx.createGain();
      this.dryGain.gain.value = 0.82;
      this.dryGain.connect(this.ctx.destination);

      const quality = getQualitySettings();
      this.maxPolyphony = quality.targetFps >= 60 ? 8 : 4;

      // Solo crear reverb y wetGain en tiers altos/medios.
      if (quality.targetFps >= 60) {
        this.wetGain = this.ctx.createGain();
        this.wetGain.gain.value = 0.18;
        this.reverb = this.createReverb(this.ctx);
        this.reverb.connect(this.wetGain);
        this.wetGain.connect(this.ctx.destination);
      }

      // Pre-cachear buffer de ruido reutilizable (0.6s, suficiente para la explosión más larga).
      this.noiseBuffer = this.createNoiseBuffer(this.ctx, 0.6);

      return this.ctx;
    } catch {
      return null;
    }
  }

  private createReverb(ctx: AudioContext): ConvolverNode {
    const rate = ctx.sampleRate;
    const length = rate * 0.3;
    const impulse = ctx.createBuffer(2, length, rate);
    for (let ch = 0; ch < 2; ch++) {
      const data = impulse.getChannelData(ch);
      for (let i = 0; i < length; i++) {
        data[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / length, 2.5);
      }
    }
    const convolver = ctx.createConvolver();
    convolver.buffer = impulse;
    return convolver;
  }

  private createNoiseBuffer(ctx: AudioContext, duration: number): AudioBuffer {
    const rate = ctx.sampleRate;
    const length = Math.max(1, Math.floor(rate * duration));
    const buffer = ctx.createBuffer(1, length, rate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < length; i++) {
      data[i] = Math.random() * 2 - 1;
    }
    return buffer;
  }

  private connectToMaster(node: AudioNode): void {
    if (!this.dryGain) return;
    node.connect(this.dryGain);
    if (this.reverb) node.connect(this.reverb);
  }

  setEnabled(enabled: boolean): void {
    this.enabled = enabled;
  }

  suspend(): void {
    if (this.ctx && this.ctx.state === 'running') {
      this.ctx.suspend();
    }
  }

  resume(): void {
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  play(name: SoundName): void {
    if (!this.enabled) return;
    const ctx = this.getContext();
    if (!ctx || !this.dryGain) return;
    if (ctx.state === 'suspended') ctx.resume();
    if (this.activeSounds >= this.maxPolyphony) return;

    this.activeSounds++;
    const onEnd = () => { this.activeSounds--; };

    switch (name) {
      case 'shoot': this.playShoot(ctx, onEnd); break;
      case 'hit': this.playHit(ctx, onEnd); break;
      case 'explode': this.playExplode(ctx, onEnd); break;
      case 'powerup': this.playPowerup(ctx, onEnd); break;
      case 'life': this.playLife(ctx, onEnd); break;
      case 'gameover': this.playGameover(ctx, onEnd); break;
      case 'combo': this.playCombo(ctx, onEnd); break;
      case 'menu_click': this.playMenuClick(ctx, onEnd); break;
      case 'menu_back': this.playMenuBack(ctx, onEnd); break;
      case 'phase_up': this.playPhaseUp(ctx, onEnd); break;
    }
  }

  private playShoot(ctx: AudioContext, onEnd: () => void): void {
    const t = ctx.currentTime;
    const osc1 = ctx.createOscillator();
    const osc2 = ctx.createOscillator();
    const gain = ctx.createGain();
    osc1.type = 'sine';
    osc2.type = 'sine';
    osc1.frequency.setValueAtTime(1200, t);
    osc1.frequency.exponentialRampToValueAtTime(400, t + 0.03);
    osc2.frequency.setValueAtTime(1208, t);
    osc2.frequency.exponentialRampToValueAtTime(408, t + 0.03);
    gain.gain.setValueAtTime(0.08, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.03);
    osc1.connect(gain);
    osc2.connect(gain);
    this.connectToMaster(gain);
    osc1.start(t);
    osc2.start(t);
    osc1.stop(t + 0.04);
    osc2.stop(t + 0.04);
    setTimeout(onEnd, 40);
  }

  private playHit(ctx: AudioContext, onEnd: () => void): void {
    const t = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(300, t);
    osc.frequency.exponentialRampToValueAtTime(100, t + 0.08);
    gain.gain.setValueAtTime(0.2, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.08);
    osc.connect(gain);
    this.connectToMaster(gain);
    osc.start(t);
    osc.stop(t + 0.09);
    setTimeout(onEnd, 90);
  }

  private playExplode(ctx: AudioContext, onEnd: () => void): void {
    const t = ctx.currentTime;
    const noise = this.createNoiseSource(ctx, 0.4);
    const noiseFilter = ctx.createBiquadFilter();
    noiseFilter.type = 'lowpass';
    noiseFilter.frequency.setValueAtTime(2000, t);
    noiseFilter.frequency.exponentialRampToValueAtTime(200, t + 0.4);
    const noiseGain = ctx.createGain();
    noiseGain.gain.setValueAtTime(0.3, t);
    noiseGain.gain.exponentialRampToValueAtTime(0.001, t + 0.4);
    noise.connect(noiseFilter);
    noiseFilter.connect(noiseGain);
    this.connectToMaster(noiseGain);
    noise.start(t, 0, 0.4);
    noise.stop(t + 0.45);

    const sub = ctx.createOscillator();
    const subGain = ctx.createGain();
    sub.type = 'sine';
    sub.frequency.setValueAtTime(50, t);
    subGain.gain.setValueAtTime(0.25, t);
    subGain.gain.exponentialRampToValueAtTime(0.001, t + 0.3);
    sub.connect(subGain);
    this.connectToMaster(subGain);
    sub.start(t);
    sub.stop(t + 0.35);
    setTimeout(onEnd, 450);
  }

  private playPowerup(ctx: AudioContext, onEnd: () => void): void {
    const t = ctx.currentTime;
    const notes = [523.25, 659.25, 783.99, 1046.5];
    const dur = 0.12;
    notes.forEach((freq, i) => {
      const osc1 = ctx.createOscillator();
      const osc2 = ctx.createOscillator();
      const gain = ctx.createGain();
      osc1.type = 'triangle';
      osc2.type = 'sine';
      osc1.frequency.value = freq;
      osc2.frequency.value = freq * 1.005;
      const start = t + i * 0.06;
      gain.gain.setValueAtTime(0, start);
      gain.gain.linearRampToValueAtTime(0.15, start + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.001, start + dur);
      osc1.connect(gain);
      osc2.connect(gain);
      this.connectToMaster(gain);
      osc1.start(start);
      osc2.start(start);
      osc1.stop(start + dur + 0.01);
      osc2.stop(start + dur + 0.01);
    });
    setTimeout(onEnd, notes.length * 60 + dur * 1000 + 20);
  }

  private playLife(ctx: AudioContext, onEnd: () => void): void {
    const t = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(400, t);
    osc.frequency.linearRampToValueAtTime(800, t + 0.3);
    gain.gain.setValueAtTime(0.2, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.35);
    osc.connect(gain);
    this.connectToMaster(gain);
    osc.start(t);
    osc.stop(t + 0.36);
    setTimeout(onEnd, 360);
  }

  private playGameover(ctx: AudioContext, onEnd: () => void): void {
    const t = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(400, t);
    osc.frequency.exponentialRampToValueAtTime(50, t + 0.8);
    gain.gain.setValueAtTime(0.2, t);
    gain.gain.linearRampToValueAtTime(0.2, t + 0.2);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.8);
    osc.connect(gain);
    this.connectToMaster(gain);
    osc.start(t);
    osc.stop(t + 0.85);

    const noise = this.createNoiseSource(ctx, 0.6);
    const nFilter = ctx.createBiquadFilter();
    nFilter.type = 'lowpass';
    nFilter.frequency.setValueAtTime(800, t);
    nFilter.frequency.exponentialRampToValueAtTime(100, t + 0.6);
    const nGain = ctx.createGain();
    nGain.gain.setValueAtTime(0.15, t);
    nGain.gain.exponentialRampToValueAtTime(0.001, t + 0.6);
    noise.connect(nFilter);
    nFilter.connect(nGain);
    this.connectToMaster(nGain);
    noise.start(t, 0, 0.6);
    noise.stop(t + 0.65);
    setTimeout(onEnd, 850);
  }

  private playCombo(ctx: AudioContext, onEnd: () => void): void {
    const t = ctx.currentTime;
    const notes = [600, 800, 1000];
    notes.forEach((freq, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      const hpf = ctx.createBiquadFilter();
      osc.type = 'square';
      osc.frequency.value = freq;
      osc.detune.value = 8;
      hpf.type = 'highpass';
      hpf.frequency.value = 200;
      const start = t + i * 0.08;
      gain.gain.setValueAtTime(0, start);
      gain.gain.linearRampToValueAtTime(0.12, start + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.001, start + 0.15);
      osc.connect(hpf);
      hpf.connect(gain);
      this.connectToMaster(gain);
      osc.start(start);
      osc.stop(start + 0.16);
    });
    setTimeout(onEnd, notes.length * 80 + 160);
  }

  private playMenuClick(ctx: AudioContext, onEnd: () => void): void {
    const t = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.value = 800;
    gain.gain.setValueAtTime(0.12, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.02);
    osc.connect(gain);
    this.connectToMaster(gain);
    osc.start(t);
    osc.stop(t + 0.025);
    setTimeout(onEnd, 25);
  }

  private playMenuBack(ctx: AudioContext, onEnd: () => void): void {
    const t = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(600, t);
    osc.frequency.exponentialRampToValueAtTime(400, t + 0.03);
    gain.gain.setValueAtTime(0.1, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.03);
    osc.connect(gain);
    this.connectToMaster(gain);
    osc.start(t);
    osc.stop(t + 0.035);
    setTimeout(onEnd, 35);
  }

  private playPhaseUp(ctx: AudioContext, onEnd: () => void): void {
    const t = ctx.currentTime;
    const notes = [261.63, 329.63, 392, 523.25, 659.25];
    notes.forEach((freq, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.value = freq;
      const start = t + i * 0.08;
      gain.gain.setValueAtTime(0, start);
      gain.gain.linearRampToValueAtTime(0.15, start + 0.03);
      gain.gain.exponentialRampToValueAtTime(0.001, start + 0.2);
      osc.connect(gain);
      this.connectToMaster(gain);
      osc.start(start);
      osc.stop(start + 0.22);
    });

    const noise = this.createNoiseSource(ctx, 0.3);
    const nFilter = ctx.createBiquadFilter();
    nFilter.type = 'bandpass';
    nFilter.frequency.setValueAtTime(400, t);
    nFilter.frequency.linearRampToValueAtTime(2000, t + 0.3);
    nFilter.Q.value = 2;
    const nGain = ctx.createGain();
    nGain.gain.setValueAtTime(0.05, t);
    nGain.gain.linearRampToValueAtTime(0.1, t + 0.15);
    nGain.gain.exponentialRampToValueAtTime(0.001, t + 0.3);
    noise.connect(nFilter);
    nFilter.connect(nGain);
    this.connectToMaster(nGain);
    noise.start(t, 0, 0.3);
    noise.stop(t + 0.35);
    setTimeout(onEnd, notes.length * 80 + 220);
  }

  private createNoiseSource(ctx: AudioContext, duration: number): AudioBufferSourceNode {
    const source = ctx.createBufferSource();
    if (this.noiseBuffer) {
      source.buffer = this.noiseBuffer;
      // El source reproduce los primeros `duration` segundos del buffer cacheado.
      // Si el buffer cacheado es más largo, el resto no se reproduce.
    } else {
      // Fallback si el buffer no se inicializó.
      const rate = ctx.sampleRate;
      const length = rate * duration;
      const buffer = ctx.createBuffer(1, length, rate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < length; i++) {
        data[i] = Math.random() * 2 - 1;
      }
      source.buffer = buffer;
    }
    return source;
  }
}

export const soundManager = new SoundManager();
