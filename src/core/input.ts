import type { GameInput, GameState } from '../core/types.js';
import { soundManager } from '../systems/audio.js';

export function setupInput(handlers: {
  onTogglePause: () => void;
  onStartGame: () => void;
  onResumeGame: () => void;
  onRestart: () => void;
  onShowInstructions: () => void;
  onHideInstructions: () => void;
  onShowLeaderboard: () => void;
  onHideLeaderboard: () => void;
  onShowCustomize: () => void;
  onHideCustomize: () => void;
  onBackToMenu: () => void;
  getState: () => GameState;
}): GameInput {
  const keys: GameInput = { touchX: null, touchY: null, left: false, right: false };

  const canvas = document.getElementById('game') as HTMLCanvasElement;
  const startScreen = document.getElementById('start-screen') as HTMLElement;
  const gameOverScreen = document.getElementById('game-over-screen') as HTMLElement;
  const pauseScreen = document.getElementById('pause-screen') as HTMLElement;
  const pauseBackBtn = document.getElementById('pause-back-btn') as HTMLElement;
  const soundToggleBtn = document.getElementById('sound-toggle-btn') as HTMLElement;
  const startBtn = document.getElementById('start-btn') as HTMLElement;
  const resumeBtn = document.getElementById('resume-btn') as HTMLElement;
  const changeNameBtn = document.getElementById('change-name-btn') as HTMLElement;
  const nameModal = document.getElementById('name-modal') as HTMLElement;
  const modalNameInput = document.getElementById('modal-name-input') as HTMLInputElement;
  const modalCancelBtn = document.getElementById('modal-cancel-btn') as HTMLElement;
  const modalSaveBtn = document.getElementById('modal-save-btn') as HTMLElement;
  const startNameDisplay = document.getElementById('start-name-display') as HTMLElement;
  const howToPlayBtn = document.getElementById('how-to-play-btn') as HTMLElement;
  const instructionsBackBtn = document.getElementById('instructions-back-btn') as HTMLElement;
  const gameoverBackBtn = document.getElementById('gameover-back-btn') as HTMLElement;
  const leaderboardBtn = document.getElementById('leaderboard-btn') as HTMLElement;
  const leaderboardBackBtn = document.getElementById('leaderboard-back-btn') as HTMLElement;
  const customizeBackBtn = document.getElementById('customize-back-btn') as HTMLElement;
  const designToggle = document.getElementById('design-toggle') as HTMLElement;
  const playerInfo = document.getElementById('player-info') as HTMLElement;
  const leaderboardScreen = document.getElementById('leaderboard-screen') as HTMLElement;

  const handleStart = (x: number, _y: number) => { keys.touchX = x; };
  const handleMove = (x: number, _y: number) => { keys.touchX = x; };
  const handleEnd = () => { keys.touchX = null; };

  canvas.addEventListener('touchstart', (e) => {
    e.preventDefault();
    const touch = e.touches[0];
    handleStart(touch.clientX, touch.clientY);
    if (handlers.getState() === 'gameover') handlers.onRestart();
  }, { passive: false });

  canvas.addEventListener('touchmove', (e) => {
    e.preventDefault();
    const touch = e.touches[0];
    handleMove(touch.clientX, touch.clientY);
  }, { passive: false });

  canvas.addEventListener('touchend', () => handleEnd());

  canvas.addEventListener('mousedown', (e) => {
    handleStart(e.clientX, e.clientY);
    if (handlers.getState() === 'gameover') handlers.onRestart();
  });

  canvas.addEventListener('mousemove', (e) => {
    if (e.buttons === 1) handleMove(e.clientX, e.clientY);
  });

  canvas.addEventListener('mouseup', () => handleEnd());
  canvas.addEventListener('mouseleave', () => handleEnd());

  startBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    soundManager.play('menu_click');
    if (handlers.getState() === 'start') handlers.onStartGame();
  });

  startBtn.addEventListener('touchstart', (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (handlers.getState() === 'start') handlers.onStartGame();
  }, { passive: false });

  resumeBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    soundManager.play('menu_click');
    if (handlers.getState() === 'start') handlers.onResumeGame();
  });

  resumeBtn.addEventListener('touchstart', (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (handlers.getState() === 'start') handlers.onResumeGame();
  }, { passive: false });

  changeNameBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    soundManager.play('menu_click');
    openNameModal();
  });

  changeNameBtn.addEventListener('touchstart', (e) => {
    e.preventDefault();
    e.stopPropagation();
    openNameModal();
  }, { passive: false });

  modalCancelBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    soundManager.play('menu_back');
    closeNameModal();
  });

  modalCancelBtn.addEventListener('touchstart', (e) => {
    e.preventDefault();
    e.stopPropagation();
    closeNameModal();
  }, { passive: false });

  modalSaveBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    soundManager.play('menu_click');
    saveName();
  });

  modalSaveBtn.addEventListener('touchstart', (e) => {
    e.preventDefault();
    e.stopPropagation();
    saveName();
  }, { passive: false });

  modalNameInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') saveName();
    if (e.key === 'Escape') closeNameModal();
  });

  nameModal.addEventListener('click', (e) => {
    if (e.target === nameModal) closeNameModal();
  });

  function openNameModal(): void {
    const currentName = startNameDisplay.textContent || 'Jugador 1';
    modalNameInput.value = currentName;
    nameModal.classList.remove('hidden');
    setTimeout(() => modalNameInput.focus(), 50);
  }

  function closeNameModal(): void {
    nameModal.classList.add('hidden');
  }

  function saveName(): void {
    const name = modalNameInput.value.trim();
    if (!name) {
      modalNameInput.style.borderBottomColor = '#ef4444';
      setTimeout(() => { modalNameInput.style.borderBottomColor = '#22d3ee'; }, 1000);
      return;
    }
    localStorage.setItem('blasto_playerName', name);
    startNameDisplay.textContent = name;
    closeNameModal();
  }

  gameOverScreen.addEventListener('click', (e) => {
    if ((e.target as HTMLElement).tagName === 'INPUT' || (e.target as HTMLElement).tagName === 'BUTTON') return;
    if (handlers.getState() === 'gameover') handlers.onRestart();
  });

  gameOverScreen.addEventListener('touchstart', (e) => {
    if ((e.target as HTMLElement).tagName === 'INPUT' || (e.target as HTMLElement).tagName === 'BUTTON') return;
    e.preventDefault();
    if (handlers.getState() === 'gameover') handlers.onRestart();
  }, { passive: false });

  playerInfo.addEventListener('click', () => {
    const state = handlers.getState();
    if (state === 'playing' || state === 'paused') handlers.onTogglePause();
  });

  playerInfo.addEventListener('touchstart', (e) => {
    e.preventDefault();
    e.stopPropagation();
    const state = handlers.getState();
    if (state === 'playing' || state === 'paused') handlers.onTogglePause();
  }, { passive: false });

  instructionsBackBtn.addEventListener('click', (e) => { e.stopPropagation(); soundManager.play('menu_back'); handlers.onHideInstructions(); });
  instructionsBackBtn.addEventListener('touchstart', (e) => { e.preventDefault(); e.stopPropagation(); handlers.onHideInstructions(); }, { passive: false });

  gameoverBackBtn.addEventListener('click', (e) => { e.stopPropagation(); soundManager.play('menu_back'); handlers.onBackToMenu(); });
  gameoverBackBtn.addEventListener('touchstart', (e) => { e.preventDefault(); e.stopPropagation(); handlers.onBackToMenu(); }, { passive: false });

  pauseScreen.addEventListener('click', () => {
    if (handlers.getState() === 'paused') handlers.onTogglePause();
  });

  pauseScreen.addEventListener('touchstart', (e) => {
    e.preventDefault();
    if (handlers.getState() === 'paused') handlers.onTogglePause();
  }, { passive: false });

  pauseBackBtn.addEventListener('click', (e) => { e.stopPropagation(); soundManager.play('menu_back'); handlers.onBackToMenu(); });
  pauseBackBtn.addEventListener('touchstart', (e) => { e.preventDefault(); e.stopPropagation(); handlers.onBackToMenu(); }, { passive: false });

  function updateSoundButton(): void {
    const enabled = localStorage.getItem('blasto_soundEnabled') !== 'false';
    soundToggleBtn.textContent = enabled ? '🔊 Sonido' : '🔇 Silenciado';
    soundManager.setEnabled(enabled);
  }

  updateSoundButton();

  soundToggleBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    const enabled = localStorage.getItem('blasto_soundEnabled') !== 'false';
    localStorage.setItem('blasto_soundEnabled', String(!enabled));
    updateSoundButton();
  });

  soundToggleBtn.addEventListener('touchstart', (e) => {
    e.preventDefault();
    e.stopPropagation();
    const enabled = localStorage.getItem('blasto_soundEnabled') !== 'false';
    localStorage.setItem('blasto_soundEnabled', String(!enabled));
    updateSoundButton();
  }, { passive: false });

  howToPlayBtn.addEventListener('click', (e) => { e.stopPropagation(); soundManager.play('menu_click'); handlers.onShowInstructions(); });
  howToPlayBtn.addEventListener('touchstart', (e) => { e.preventDefault(); e.stopPropagation(); handlers.onShowInstructions(); }, { passive: false });

  leaderboardBtn.addEventListener('click', (e) => { e.stopPropagation(); soundManager.play('menu_click'); handlers.onShowLeaderboard(); });
  leaderboardBtn.addEventListener('touchstart', (e) => { e.preventDefault(); e.stopPropagation(); handlers.onShowLeaderboard(); }, { passive: false });

  leaderboardBackBtn.addEventListener('click', (e) => { e.stopPropagation(); soundManager.play('menu_back'); handlers.onHideLeaderboard(); });
  leaderboardBackBtn.addEventListener('touchstart', (e) => { e.preventDefault(); e.stopPropagation(); handlers.onHideLeaderboard(); }, { passive: false });

  if (designToggle) {
    designToggle.addEventListener('click', (e) => { e.stopPropagation(); soundManager.play('menu_click'); handlers.onShowCustomize(); });
    designToggle.addEventListener('touchstart', (e) => { e.preventDefault(); e.stopPropagation(); handlers.onShowCustomize(); }, { passive: false });
  }

  if (customizeBackBtn) {
    customizeBackBtn.addEventListener('click', (e) => { e.stopPropagation(); soundManager.play('menu_back'); handlers.onHideCustomize(); });
    customizeBackBtn.addEventListener('touchstart', (e) => { e.preventDefault(); e.stopPropagation(); handlers.onHideCustomize(); }, { passive: false });
  }

  leaderboardScreen.querySelectorAll('.lb-tab').forEach((tab) => {
    tab.addEventListener('click', (e) => {
      e.stopPropagation();
      const target = (tab as HTMLElement).dataset.tab;
      leaderboardScreen.querySelectorAll('.lb-tab').forEach(t => t.classList.remove('active'));
      tab.classList.add('active');
      (document.getElementById('lb-local-tab') as HTMLElement).classList.toggle('hidden', target !== 'local');
      (document.getElementById('lb-global-tab') as HTMLElement).classList.toggle('hidden', target !== 'global');
    });
  });

  let startFocusIdx = 0;
  let pauseFocusIdx = -1;
  let prevInputState: GameState = handlers.getState();

  function clearAllFocus(): void {
    document.querySelectorAll('.kb-focused').forEach(el => el.classList.remove('kb-focused'));
  }

  function getStartButtons(): HTMLElement[] {
    const btns: HTMLElement[] = [];
    if (!resumeBtn.classList.contains('hidden')) btns.push(resumeBtn);
    btns.push(startBtn);
    if (designToggle) btns.push(designToggle);
    btns.push(howToPlayBtn);
    btns.push(leaderboardBtn);
    return btns;
  }

  window.addEventListener('keydown', (e) => {
    const state = handlers.getState();

    if (state !== prevInputState) {
      clearAllFocus();
      if (state === 'start') {
        startFocusIdx = 0;
        const btns = getStartButtons();
        btns[0]?.classList.add('kb-focused');
      }
      if (state === 'paused') {
        pauseFocusIdx = -1;
      }
      prevInputState = state;
    }

    if (e.key === 'ArrowLeft') keys.left = true;
    if (e.key === 'ArrowRight') keys.right = true;

    if (e.key === 'Escape') {
      if (state === 'instructions') { handlers.onHideInstructions(); return; }
      if (state === 'leaderboard') { handlers.onHideLeaderboard(); return; }
      if (state === 'customize') { handlers.onHideCustomize(); return; }
      if (state === 'paused' && pauseFocusIdx >= 0) {
        pauseFocusIdx = -1;
        clearAllFocus();
        return;
      }
    }
    if (e.key === 'p' || e.key === 'P' || e.key === 'Escape') {
      if (state === 'playing' || state === 'paused') { handlers.onTogglePause(); return; }
    }

    if (state === 'start') {
      if (!nameModal.classList.contains('hidden')) return;
      const btns = getStartButtons();
      if (e.key === 'ArrowUp' || e.key === 'ArrowDown') {
        e.preventDefault();
        if (btns.length === 0) return;
        btns[startFocusIdx]?.classList.remove('kb-focused');
        if (e.key === 'ArrowUp') {
          startFocusIdx = (startFocusIdx - 1 + btns.length) % btns.length;
        } else {
          startFocusIdx = (startFocusIdx + 1) % btns.length;
        }
        btns[startFocusIdx].classList.add('kb-focused');
        return;
      }
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        if (document.activeElement?.tagName === 'INPUT') return;
        if (startFocusIdx >= 0 && startFocusIdx < btns.length) {
          btns[startFocusIdx].click();
        }
        return;
      }
      return;
    }

    if (state === 'paused') {
      const pauseBtns: HTMLElement[] = [pauseBackBtn, soundToggleBtn];
      if (e.key === 'ArrowUp' || e.key === 'ArrowDown') {
        e.preventDefault();
        clearAllFocus();
        if (pauseFocusIdx === -1) {
          pauseFocusIdx = e.key === 'ArrowDown' ? 0 : pauseBtns.length - 1;
        } else {
          if (e.key === 'ArrowUp') {
            pauseFocusIdx = (pauseFocusIdx - 1 + pauseBtns.length) % pauseBtns.length;
          } else {
            pauseFocusIdx = (pauseFocusIdx + 1) % pauseBtns.length;
          }
        }
        pauseBtns[pauseFocusIdx].classList.add('kb-focused');
        return;
      }
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        if (pauseFocusIdx >= 0) {
          pauseBtns[pauseFocusIdx].click();
          pauseFocusIdx = -1;
          clearAllFocus();
        } else {
          handlers.onTogglePause();
        }
        return;
      }
      if (e.key === 'b' || e.key === 'B') { handlers.onBackToMenu(); return; }
      if (e.key === 's' || e.key === 'S') { soundToggleBtn.click(); return; }
      return;
    }

    if (state === 'gameover') {
      if (document.activeElement?.tagName === 'INPUT') return;
      if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); handlers.onRestart(); return; }
      if (e.key === 'b' || e.key === 'B') { handlers.onBackToMenu(); return; }
      return;
    }

    if (state === 'instructions') {
      if (e.key === 'Enter' || e.key === ' ' || e.key === 'b' || e.key === 'B') {
        e.preventDefault(); handlers.onHideInstructions(); return;
      }
      return;
    }

    if (state === 'leaderboard') {
      if (e.key === 'b' || e.key === 'B') { handlers.onHideLeaderboard(); return; }
      if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') {
        e.preventDefault();
        const tabs = leaderboardScreen.querySelectorAll('.lb-tab');
        const active = leaderboardScreen.querySelector('.lb-tab.active');
        if (!active || tabs.length === 0) return;
        const idx = Array.from(tabs).indexOf(active);
        const next = e.key === 'ArrowRight' ? (idx + 1) % tabs.length : (idx - 1 + tabs.length) % tabs.length;
        (tabs[next] as HTMLElement).click();
        soundManager.play('menu_click');
        return;
      }
      return;
    }

    if (state === 'customize') {
      if (e.key === 'b' || e.key === 'B') { handlers.onHideCustomize(); return; }
      if (e.key === 'Tab') {
        e.preventDefault();
        const tabs = document.querySelectorAll('.customize-tab') as NodeListOf<HTMLElement>;
        const active = document.querySelector('.customize-tab.active') as HTMLElement;
        if (!active || tabs.length === 0) return;
        const idx = Array.from(tabs).indexOf(active);
        const next = e.shiftKey ? (idx - 1 + tabs.length) % tabs.length : (idx + 1) % tabs.length;
        tabs[next].click();
        soundManager.play('menu_click');
        return;
      }
      if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') {
        e.preventDefault();
        const section = document.querySelector('.customize-section.active');
        if (!section) return;
        const items = section.querySelectorAll('.customize-color-item, .customize-design-item, .customize-bullet-item, .customize-bg-item');
        if (items.length === 0) return;
        const selected = section.querySelector('.selected');
        const idx = selected ? Array.from(items).indexOf(selected) : 0;
        const next = e.key === 'ArrowRight' ? (idx + 1) % items.length : (idx - 1 + items.length) % items.length;
        (items[next] as HTMLElement).click();
        soundManager.play('menu_click');
        return;
      }
      return;
    }
  });

  window.addEventListener('keyup', (e) => {
    if (e.key === 'ArrowLeft') keys.left = false;
    if (e.key === 'ArrowRight') keys.right = false;
  });

  return keys;
}
