export function hexToRgb(hex: string): string {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result
    ? `${parseInt(result[1], 16)}, ${parseInt(result[2], 16)}, ${parseInt(result[3], 16)}`
    : '255, 255, 255';
}

export function getDesignSVG(designId: string, color: string): string {
  let path = '';
  switch (designId) {
    case 'triangle':
      path = `<polygon points="20,4 36,32 4,32" fill="none" stroke="${color}" stroke-width="2"/>`;
      break;
    case 'diamond':
      path = `<polygon points="20,2 36,20 20,38 4,20" fill="none" stroke="${color}" stroke-width="2"/>`;
      break;
    case 'wing':
      path = `<polygon points="20,2 36,30 26,24 20,32 14,24 4,30" fill="none" stroke="${color}" stroke-width="2"/>`;
      break;
    case 'hexagon':
      path = `<polygon points="20,2 35,11 35,29 20,38 5,29 5,11" fill="none" stroke="${color}" stroke-width="2"/>`;
      break;
  }
  return `<svg viewBox="0 0 40 40">${path}</svg>`;
}
