export class DebugOverlay {
  constructor() {
    this.enabled = false;
    this.visited = [];
    this.path = [];
  }

  setData(visited, path) {
    this.visited = visited || [];
    this.path = path || [];
  }

  render(ctx, grid) {
    if (!this.enabled) {
      return;
    }

    ctx.save();
    ctx.globalAlpha = 0.5;
    for (const cell of this.visited) {
      const left = cell.x * grid.cellSize;
      const top = cell.y * grid.cellSize;
      ctx.fillStyle = "#9aa1aa";
      ctx.fillRect(left + 2, top + 2, grid.cellSize - 4, grid.cellSize - 4);
    }

    ctx.globalAlpha = 0.8;
    for (const cell of this.path) {
      const left = cell.x * grid.cellSize;
      const top = cell.y * grid.cellSize;
      ctx.fillStyle = "#6ac2a8";
      ctx.fillRect(left + 6, top + 6, grid.cellSize - 12, grid.cellSize - 12);
    }
    ctx.restore();
  }
}
