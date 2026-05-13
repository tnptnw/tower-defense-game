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
      y: Math.floor(py / this.cellSize),
    };
  }

  cellToWorldCenter(x, y) {
    return {
      x: x * this.cellSize + this.cellSize / 2,
      y: y * this.cellSize + this.cellSize / 2,
    };
  }

  render(ctx) {
    ctx.save();
    ctx.clearRect(0, 0, this.cols * this.cellSize, this.rows * this.cellSize);
    const width = this.cols * this.cellSize;
    const height = this.rows * this.cellSize;
    if (BACKGROUND_IMAGE.complete && BACKGROUND_IMAGE.naturalWidth > 0) {
      ctx.drawImage(BACKGROUND_IMAGE, 0, 0, width, height);
    } else {
      ctx.fillStyle = "#f7f4ee";
      ctx.fillRect(0, 0, width, height);
    }

    ctx.lineWidth = 1;
    ctx.strokeStyle = "rgba(255,255,255,0.35)";
    for (let y = 0; y < this.rows; y += 1) {
      for (let x = 0; x < this.cols; x += 1) {
        const left = x * this.cellSize;
        const top = y * this.cellSize;
        ctx.strokeRect(left, top, this.cellSize, this.cellSize);
        if (this.isTerrain(x, y)) {
          if (OBSTACLE_IMAGE.complete && OBSTACLE_IMAGE.naturalWidth > 0) {
            const size = this.cellSize * 0.95;
            ctx.drawImage(
              OBSTACLE_IMAGE,
              left + (this.cellSize - size) / 2,
              top + (this.cellSize - size) / 2,
              size,
              size,
            );
          } else {
            ctx.fillStyle = "rgba(40,40,40,0.35)";
            ctx.fillRect(
              left + 1,
              top + 1,
              this.cellSize - 2,
              this.cellSize - 2,
            );
          }
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

const BACKGROUND_IMAGE = new Image();
BACKGROUND_IMAGE.src = "assets/Backgound.png";

const OBSTACLE_IMAGE = new Image();
OBSTACLE_IMAGE.src = "assets/Obstacle.svg";
