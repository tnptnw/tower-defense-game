export class Grid {
  constructor(config) {
    this.cols = config.grid.cols;
    this.rows = config.grid.rows;
    this.cellSize = config.grid.cellSize;
    this.canvasWidth = config.grid.canvasWidth || this.cols * this.cellSize;
    this.canvasHeight = config.grid.canvasHeight || this.rows * this.cellSize;
    const gridWidth = this.cols * this.cellSize;
    const gridHeight = this.rows * this.cellSize;
    this.offsetX =
      typeof config.grid.offsetX === "number"
        ? config.grid.offsetX
        : Math.max(0, Math.floor((this.canvasWidth - gridWidth) / 2));
    this.offsetY =
      typeof config.grid.offsetY === "number"
        ? config.grid.offsetY
        : Math.max(0, Math.floor((this.canvasHeight - gridHeight) / 2));
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
      x: Math.floor((px - this.offsetX) / this.cellSize),
      y: Math.floor((py - this.offsetY) / this.cellSize),
    };
  }

  cellToWorldCenter(x, y) {
    return {
      x: this.offsetX + x * this.cellSize + this.cellSize / 2,
      y: this.offsetY + y * this.cellSize + this.cellSize / 2,
    };
  }

  render(ctx) {
    ctx.save();
    ctx.clearRect(0, 0, this.canvasWidth, this.canvasHeight);
    const width = this.canvasWidth;
    const height = this.canvasHeight;
    if (BACKGROUND_IMAGE.complete && BACKGROUND_IMAGE.naturalWidth > 0) {
      ctx.drawImage(BACKGROUND_IMAGE, 0, 0, width, height);
    } else {
      ctx.fillStyle = "#f7f4ee";
      ctx.fillRect(0, 0, width, height);
    }

    ctx.lineWidth = 0.6;
    ctx.strokeStyle = "rgba(255,255,255,0.2)";
    for (let y = 0; y < this.rows; y += 1) {
      for (let x = 0; x < this.cols; x += 1) {
        const left = this.offsetX + x * this.cellSize;
        const top = this.offsetY + y * this.cellSize;
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

    const startPos = this.cellToWorldCenter(this.start.x, this.start.y);
    if (ENEMY_BASE_IMAGE.complete && ENEMY_BASE_IMAGE.naturalWidth > 0) {
      const size = this.cellSize * 0.95;
      ctx.drawImage(
        ENEMY_BASE_IMAGE,
        startPos.x - size / 2,
        startPos.y - size / 2,
        size,
        size,
      );
    } else {
      ctx.fillStyle = "#0f8a7a";
      ctx.beginPath();
      ctx.arc(startPos.x, startPos.y, this.cellSize * 0.3, 0, Math.PI * 2);
      ctx.fill();
    }

    const goalPos = this.cellToWorldCenter(this.goal.x, this.goal.y);
    if (TOWER_BASE_IMAGE.complete && TOWER_BASE_IMAGE.naturalWidth > 0) {
      const size = this.cellSize * 1.0;
      ctx.drawImage(
        TOWER_BASE_IMAGE,
        goalPos.x - size / 2,
        goalPos.y - size / 2,
        size,
        size,
      );
    } else {
      ctx.fillStyle = "#c6462f";
      ctx.beginPath();
      ctx.arc(goalPos.x, goalPos.y, this.cellSize * 0.35, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.restore();
  }
}

const BACKGROUND_IMAGE = new Image();
BACKGROUND_IMAGE.src = "assets/Background.png";

const OBSTACLE_IMAGE = new Image();
OBSTACLE_IMAGE.src = "assets/Obstacle.svg";

const ENEMY_BASE_IMAGE = new Image();
ENEMY_BASE_IMAGE.src = "assets/Enemy base.png";

const TOWER_BASE_IMAGE = new Image();
TOWER_BASE_IMAGE.src = "assets/Tower base.png";
