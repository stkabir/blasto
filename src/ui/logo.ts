const CYAN_DEFS = `
  <defs>
    <linearGradient id="lgTopC" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#a5f3fc"/>
      <stop offset="55%" stop-color="#22d3ee"/>
      <stop offset="100%" stop-color="#0e7490"/>
    </linearGradient>
    <linearGradient id="lgBLC" x1="100%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" stop-color="#67e8f9"/>
      <stop offset="55%" stop-color="#0891b2"/>
      <stop offset="100%" stop-color="#155e75"/>
    </linearGradient>
    <linearGradient id="lgBRC" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#67e8f9"/>
      <stop offset="55%" stop-color="#0e7490"/>
      <stop offset="100%" stop-color="#155e75"/>
    </linearGradient>
    <linearGradient id="lgShineC" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" stop-color="rgba(255,255,255,0.6)"/>
      <stop offset="55%" stop-color="rgba(255,255,255,0)"/>
    </linearGradient>
    <filter id="lgGlowC" x="-40%" y="-40%" width="180%" height="180%">
      <feGaussianBlur stdDeviation="2.2" result="b1"/>
      <feColorMatrix in="b1" type="matrix" values="
        0 0 0 0 0.13
        0 0 0 0 0.83
        0 0 0 0 0.93
        0 0 0 1.3 0" result="g1"/>
      <feMerge>
        <feMergeNode in="g1"/>
        <feMergeNode in="SourceGraphic"/>
      </feMerge>
    </filter>
  </defs>`;

function aMarkBody(suffix: string, stroke: string, thrust: [string, string, string], crossbar: boolean): string {
  const cb = crossbar
    ? `<line x1="33" y1="63" x2="67" y2="63" stroke="${stroke}" stroke-width="1.8" stroke-linecap="square" opacity="0.92"/>`
    : '';
  return `
    <g filter="url(#lgGlow${suffix})">
      <polygon points="50,4 50,63 33,63 6,78" fill="url(#lgBL${suffix})" stroke="${stroke}" stroke-width="1.2" stroke-linejoin="miter"/>
      <polygon points="50,4 50,63 67,63 94,78" fill="url(#lgBR${suffix})" stroke="${stroke}" stroke-width="1.2" stroke-linejoin="miter"/>
      <polygon points="50,4 67,63 50,84 33,63" fill="url(#lgTop${suffix})" stroke="${stroke}" stroke-width="1.2" stroke-linejoin="miter"/>
      <polygon points="50,9 43,40 57,40" fill="url(#lgShine${suffix})" opacity="0.6"/>
      <circle cx="50" cy="34" r="5.2" fill="${stroke}" opacity="0.22"/>
      <circle cx="50" cy="34" r="2.6" fill="#f0fff5" opacity="0.95"/>
      ${cb}
      <polygon points="50,84 46,90 54,90" fill="${thrust[0]}" opacity="0.85"/>
      <polygon points="50,90 47,94.5 53,94.5" fill="${thrust[1]}" opacity="0.55"/>
      <polygon points="50,94.5 48.5,97.8 51.5,97.8" fill="${thrust[2]}" opacity="0.65"/>
    </g>`;
}

export function getLogoSVG(size: number = 100): string {
  return `<svg viewBox="0 0 100 100" width="${size}" height="${size}" xmlns="http://www.w3.org/2000/svg" aria-label="Blasto">${CYAN_DEFS}${aMarkBody('C', '#22d3ee', ['#a5f3fc', '#22d3ee', '#0e7490'], true)}</svg>`;
}

export function getSplashLogoSVG(size: number = 100): string {
  return getLogoSVG(size);
}

export function getFaviconSVG(): string {
  return `<svg viewBox="0 0 100 100" width="32" height="32" xmlns="http://www.w3.org/2000/svg" aria-label="Blasto">
    <rect width="100" height="100" rx="18" fill="#0b1017"/>
    ${CYAN_DEFS}
    ${aMarkBody('C', '#22d3ee', ['#a5f3fc', '#22d3ee', '#0e7490'], true)}
  </svg>`;
}

export function getSocialSVG(): string {
  return `<svg viewBox="0 0 1200 630" xmlns="http://www.w3.org/2000/svg" aria-label="Blasto">
    <rect width="1200" height="630" fill="#0b1017"/>
    <g opacity="0.04">
      <line x1="0" y1="0" x2="1200" y2="630" stroke="#22d3ee" stroke-width="1"/>
      <line x1="200" y1="0" x2="1200" y2="430" stroke="#22d3ee" stroke-width="1"/>
      <line x1="400" y1="0" x2="1200" y2="230" stroke="#22d3ee" stroke-width="1"/>
      <line x1="600" y1="0" x2="1200" y2="30" stroke="#22d3ee" stroke-width="1"/>
      <line x1="0" y1="200" x2="1000" y2="630" stroke="#22d3ee" stroke-width="1"/>
      <line x1="0" y1="400" x2="800" y2="630" stroke="#22d3ee" stroke-width="1"/>
      <line x1="0" y1="600" x2="600" y2="630" stroke="#22d3ee" stroke-width="1"/>
    </g>
    ${CYAN_DEFS}
    <g transform="translate(600, 315) scale(3.8) translate(-50, -50)">
      ${aMarkBody('C', '#22d3ee', ['#a5f3fc', '#22d3ee', '#0e7490'], true)}
    </g>
  </svg>`;
}

export function getWordmarkSVG(): string {
  const aMark = `<span class="logo-a-mark" aria-hidden="true">${getLogoSVG(88)}</span>`;
  return `<div class="logo-wordmark">
    <div class="logo-wordmark-row">
      <span class="logo-letter">B</span>
      <span class="logo-letter">L</span>
      ${aMark}
      <span class="logo-letter">S</span>
      <span class="logo-letter">T</span>
      <span class="logo-letter">O</span>
    </div>
  </div>`;
}