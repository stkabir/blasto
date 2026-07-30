let width = 0;
let height = 0;

export function setScreenSize(w: number, h: number): void {
  width = w;
  height = h;
}

export function getScreenWidth(): number {
  return width || window.innerWidth;
}

export function getScreenHeight(): number {
  return height || window.innerHeight;
}
