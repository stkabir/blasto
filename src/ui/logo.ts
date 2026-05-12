export function getLogoSVG(size: number = 100): string {
  return `<svg viewBox="0 0 100 100" width="${size}" height="${size}" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <linearGradient id="logoGrad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="#10b981"/>
        <stop offset="100%" stop-color="#a855f7"/>
      </linearGradient>
      <linearGradient id="logoHighlight" x1="0%" y1="0%" x2="0%" y2="100%">
        <stop offset="0%" stop-color="rgba(255,255,255,0.35)"/>
        <stop offset="100%" stop-color="rgba(255,255,255,0)"/>
      </linearGradient>
      <radialGradient id="logoCore" cx="50%" cy="55%" r="30%">
        <stop offset="0%" stop-color="#22ff9e"/>
        <stop offset="100%" stop-color="#a855f7"/>
      </radialGradient>
      <filter id="logoGlow" x="-30%" y="-30%" width="160%" height="160%">
        <feGaussianBlur stdDeviation="3.5" result="blur"/>
        <feColorMatrix type="saturate" values="1.8" in="blur" result="saturated"/>
        <feMerge>
          <feMergeNode in="saturated"/>
          <feMergeNode in="SourceGraphic"/>
        </feMerge>
      </filter>
    </defs>
    <polygon points="50,8 10,78 90,78" fill="url(#logoGrad)" stroke="#22ff9e" stroke-width="1.5" stroke-opacity="0.9" filter="url(#logoGlow)"/>
    <polygon points="50,16 18,70 82,70" fill="url(#logoHighlight)" opacity="0.6"/>
    <circle cx="50" cy="52" r="8" fill="url(#logoCore)" opacity="0.7"/>
  </svg>`;
}

export function getFaviconSVG(): string {
  return `<svg viewBox="0 0 32 32" width="32" height="32" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <linearGradient id="favGrad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="#10b981"/>
        <stop offset="100%" stop-color="#a855f7"/>
      </linearGradient>
      <filter id="favGlow" x="-20%" y="-20%" width="140%" height="140%">
        <feGaussianBlur stdDeviation="1" result="blur"/>
        <feMerge>
          <feMergeNode in="blur"/>
          <feMergeNode in="SourceGraphic"/>
        </feMerge>
      </filter>
    </defs>
    <rect width="32" height="32" fill="#07120c"/>
    <polygon points="16,3 3,27 29,27" fill="url(#favGrad)" stroke="#22ff9e" stroke-width="0.5" stroke-opacity="0.8" filter="url(#favGlow)"/>
    <circle cx="16" cy="18" r="3" fill="#22ff9e" opacity="0.5"/>
  </svg>`;
}

export function getWordmarkSVG(): string {
  return `<div class="logo-wordmark">
    <span class="logo-icon">${getLogoSVG(48)}</span>
    <h1 class="logo-title">BLASTO</h1>
  </div>`;
}
