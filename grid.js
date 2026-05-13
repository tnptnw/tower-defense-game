export class Grid {
  constructor(config) {
    this.cols = config.grid.cols;
    this.rows = config.grid.rows;
    this.cellSize = config.grid.cellSize;
    this.start = { ...config.start };
    this.goal = { ...config.goal };
    this.terrain = new Set();
    this.towerMap = new Map();
    for (const cell of config.map.blocked) {
      this.terrain.add(this.key(cell.x, cell.y));
    }
  }

  key(x, y) {
    return `${x},${y}`;
  }

  isInside(x, y) {
    return x >= 0 && x < this.cols && y >= 0 && y < this.rows;
  }

  isTerrain(x, y) {
    return this.terrain.has(this.key(x, y));
  }

  isBlocked(x, y) {
    return this.isTerrain(x, y) || this.towerMap.has(this.key(x, y));
  }

  isWalkable(x, y) {
    return this.isInside(x, y) && !this.isBlocked(x, y);
  }

  isBuildable(x, y) {
    if (!this.isInside(x, y)) {
      return false;
    }
    if (x === this.start.x && y === this.start.y) {
      return false;
    }
    if (x === this.goal.x && y === this.goal.y) {
      return false;
    }
    return !this.isTerrain(x, y) && !this.towerMap.has(this.key(x, y));
  }

  setTower(x, y, tower) {
    this.towerMap.set(this.key(x, y), tower);
  }

  clearTower(x, y) {
    this.towerMap.delete(this.key(x, y));
  }

  getTowerAt(x, y) {
    return this.towerMap.get(this.key(x, y)) || null;
  }

  worldToCell(px, py) {
    return {
      x: Math.floor(px / this.cellSize),
      y: Math.floor(py / this.cellSize)
    };
  }

  cellToWorldCenter(x, y) {
    return {
      x: x * this.cellSize + this.cellSize / 2,
      y: y * this.cellSize + this.cellSize / 2
    };
  }

  render(ctx) {
    ctx.save();
    ctx.clearRect(0, 0, this.cols * this.cellSize, this.rows * this.cellSize);
    ctx.fillStyle = "#f7f4ee";
    ctx.fillRect(0, 0, this.cols * this.cellSize, this.rows * this.cellSize);

    for (let y = 0; y < this.rows; y += 1) {
      for (let x = 0; x < this.cols; x += 1) {
        const left = x * this.cellSize;
        const top = y * this.cellSize;
        ctx.strokeStyle = "#e3ded7";
        ctx.strokeRect(left, top, this.cellSize, this.cellSize);
        if (this.isTerrain(x, y)) {
          ctx.fillStyle = "#b0a7a0";
          ctx.fillRect(left + 1, top + 1, this.cellSize - 2, this.cellSize - 2);
        }
      }
    }

    ctx.fillStyle = "#0f8a7a";
    const startPos = this.cellToWorldCenter(this.start.x, this.start.y);
    ctx.beginPath();
    ctx.arc(startPos.x, startPos.y, this.cellSize * 0.3, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = "#c6462f";
    const goalPos = this.cellToWorldCenter(this.goal.x, this.goal.y);
    ctx.beginPath();
    ctx.arc(goalPos.x, goalPos.y, this.cellSize * 0.35, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
  }
}
