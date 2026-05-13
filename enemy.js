import { EnemyState, runFSM } from "./enemyFSM.js";

let ENEMY_ID = 0;

export class Enemy {
  constructor(typeKey, grid, config, multipliers) {
    const base = config.enemies[typeKey];
    this.id = ENEMY_ID + 1;
    ENEMY_ID += 1;

    this.typeKey = typeKey;
    this.name = base.name;
    this.isTank = typeKey === "tank";
    this.isBoss = typeKey === "boss";

    this.maxHp = Math.round(base.hp * multipliers.hp);
    this.hp = this.maxHp;
    this.speedCells = base.speed * multipliers.speed;
    this.reward = base.reward;
    this.color = base.color;

    this.attackDamage = base.attackDamage || 0;
    this.attackRate = base.attackRate || 0;
    this.attackCooldown = 0;

    const start = grid.cellToWorldCenter(grid.start.x, grid.start.y);
    this.position = { x: start.x, y: start.y };
    this.path = [];
    this.pathIndex = 0;
    this.reachedGoal = false;

    this.slowMultiplier = 1;
    this.slowTimer = 0;

    this.state = EnemyState.IDLE;
    this.deathTimer = 0;
    this.targetTower = null;
  }

  getCell(cellSize) {
    return {
      x: Math.floor(this.position.x / cellSize),
      y: Math.floor(this.position.y / cellSize)
    };
  }

  setPath(path) {
    this.path = path || [];
    this.pathIndex = 0;
  }

  applySlow(multiplier, duration) {
    this.slowMultiplier = Math.min(this.slowMultiplier, multiplier);
    this.slowTimer = Math.max(this.slowTimer, duration);
  }

  takeDamage(amount) {
    this.hp -= amount;
  }

  update(dt, context) {
    if (this.slowTimer > 0) {
      this.slowTimer -= dt;
      if (this.slowTimer <= 0) {
        this.slowMultiplier = 1;
      }
    }

    runFSM(this, context, dt);
  }

  moveAlongPath(dt, context) {
    if (!this.path || this.path.length === 0) {
      return;
    }

    if (this.pathIndex >= this.path.length) {
      return;
    }

    const grid = context.grid;
    const targetCell = this.path[this.pathIndex];
    const targetPos = grid.cellToWorldCenter(targetCell.x, targetCell.y);
    const dx = targetPos.x - this.position.x;
    const dy = targetPos.y - this.position.y;
    const distance = Math.hypot(dx, dy);

    const bossBuff = context.getBossBuffMultiplier(this);
    const speedPx = this.speedCells * grid.cellSize * this.slowMultiplier * bossBuff;
    const step = speedPx * dt;

    if (distance <= step) {
      this.position.x = targetPos.x;
      this.position.y = targetPos.y;
      this.pathIndex += 1;
      if (this.pathIndex >= this.path.length) {
        this.reachedGoal = true;
      }
      return;
    }

    this.position.x += (dx / distance) * step;
    this.position.y += (dy / distance) * step;
  }

  attackTower(dt, tower) {
    this.attackCooldown -= dt;
    if (this.attackCooldown > 0) {
      return;
    }
    this.attackCooldown = 1 / this.attackRate;
    tower.takeDamage(this.attackDamage);
  }

  render(ctx, cellSize) {
    const radius = this.isBoss ? cellSize * 0.38 : cellSize * 0.28;
    ctx.save();
    ctx.fillStyle = this.color;
    ctx.beginPath();
    ctx.arc(this.position.x, this.position.y, radius, 0, Math.PI * 2);
    ctx.fill();

    const hpRatio = Math.max(this.hp, 0) / this.maxHp;
    ctx.fillStyle = "rgba(0,0,0,0.15)";
    ctx.fillRect(
      this.position.x - radius,
      this.position.y - radius - 6,
      radius * 2,
      4
    );
    ctx.fillStyle = "#0f8a7a";
    ctx.fillRect(
      this.position.x - radius,
      this.position.y - radius - 6,
      radius * 2 * hpRatio,
      4
    );
    ctx.restore();
  }
}
