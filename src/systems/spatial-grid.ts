import type { Asteroid } from '../entities/asteroid.js';

export class SpatialGrid {
  private cellSize: number;
  private cols: number;
  private rows: number;
  private cells: Asteroid[][];

  constructor(width: number, height: number, cellSize: number = 120) {
    this.cellSize = cellSize;
    this.cols = Math.max(1, Math.ceil(width / cellSize));
    this.rows = Math.max(1, Math.ceil(height / cellSize));
    this.cells = new Array(this.cols * this.rows);
    for (let i = 0; i < this.cells.length; i++) {
      this.cells[i] = [];
    }
  }

  resize(width: number, height: number): void {
    this.cols = Math.max(1, Math.ceil(width / this.cellSize));
    this.rows = Math.max(1, Math.ceil(height / this.cellSize));
    const newLen = this.cols * this.rows;
    if (this.cells.length !== newLen) {
      this.cells.length = newLen;
      for (let i = 0; i < this.cells.length; i++) {
        if (!this.cells[i]) this.cells[i] = [];
      }
    }
  }

  clear(): void {
    for (let i = 0; i < this.cells.length; i++) {
      this.cells[i].length = 0;
    }
  }

  private cellIndex(x: number, y: number, radius: number): { minCol: number; maxCol: number; minRow: number; maxRow: number } {
    const cs = this.cellSize;
    const minCol = Math.max(0, Math.floor((x - radius) / cs));
    const maxCol = Math.min(this.cols - 1, Math.floor((x + radius) / cs));
    const minRow = Math.max(0, Math.floor((y - radius) / cs));
    const maxRow = Math.min(this.rows - 1, Math.floor((y + radius) / cs));
    return { minCol, maxCol, minRow, maxRow };
  }

  insert(a: Asteroid): void {
    const { minCol, maxCol, minRow, maxRow } = this.cellIndex(a.x, a.y, a.radius);
    for (let r = minRow; r <= maxRow; r++) {
      for (let c = minCol; c <= maxCol; c++) {
        this.cells[r * this.cols + c].push(a);
      }
    }
  }

  /**
   * Itera los asteroides cercanos a (x, y, radius) sin duplicados.
   * El callback debe devolver true para detener la iteración.
   */
  query(x: number, y: number, radius: number, callback: (a: Asteroid) => boolean): void {
    const { minCol, maxCol, minRow, maxRow } = this.cellIndex(x, y, radius);
    const seen = new Set<Asteroid>();
    for (let r = minRow; r <= maxRow; r++) {
      for (let c = minCol; c <= maxCol; c++) {
        const cell = this.cells[r * this.cols + c];
        for (let i = 0; i < cell.length; i++) {
          const a = cell[i];
          if (!seen.has(a)) {
            seen.add(a);
            if (callback(a)) return;
          }
        }
      }
    }
  }
}
