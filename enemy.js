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
    this.attackFxTimer = 0;
    this.attackFxDuration = 0.14;
    this.attackFxFrom = null;
    this.attackFxTo = null;
    this.attackFxCooldown = 0;

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

  getCell(grid) {
    return grid.worldToCell(this.position.x, this.position.y);
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

    if (this.attackFxTimer > 0) {
      this.attackFxTimer -= dt;
      if (this.attackFxTimer <= 0) {
        this.attackFxFrom = null;
        this.attackFxTo = null;
      }
    }

    if (this.attackFxCooldown > 0) {
      this.attackFxCooldown -= dt;
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
    const speedPx =
      this.speedCells * grid.cellSize * this.slowMultiplier * bossBuff;
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

  attackTower(dt, tower, grid) {
    this.attackCooldown -= dt;
    if (this.attackCooldown > 0) {
      return;
    }
    const attackRate = this.attackRate > 0 ? this.attackRate : 1;
    this.attackCooldown = 1 / attackRate;
    this.triggerAttackFx(tower, grid);
    if (this.attackDamage > 0) {
      tower.takeDamage(this.attackDamage, this.typeKey);
    }
  }

  triggerAttackFx(tower, grid) {
    if (!grid || this.attackFxCooldown > 0) {
      return;
    }
    this.attackFxTimer = this.attackFxDuration;
    this.attackFxFrom = { x: this.position.x, y: this.position.y };
    this.attackFxTo = grid.cellToWorldCenter(tower.cell.x, tower.cell.y);
    this.attackFxCooldown = this.attackFxDuration * 2;
  }

  render(ctx, cellSize) {
    const radius = this.isBoss ? cellSize * 0.38 : cellSize * 0.28;
    const sprite = ENEMY_SPRITES[this.typeKey];
    const size = this.isBoss ? cellSize * 1.1 : cellSize * 0.9;
    ctx.save();
    if (sprite && sprite.complete && sprite.naturalWidth > 0) {
      ctx.drawImage(
        sprite,
        this.position.x - size / 2,
        this.position.y - size / 2,
        size,
        size,
      );
    } else {
      ctx.fillStyle = this.color;
      ctx.beginPath();
      ctx.arc(this.position.x, this.position.y, radius, 0, Math.PI * 2);
      ctx.fill();
    }

    const hpRatio = Math.max(this.hp, 0) / this.maxHp;
    ctx.fillStyle = "rgba(0,0,0,0.15)";
    ctx.fillRect(
      this.position.x - radius,
      this.position.y - radius - 6,
      radius * 2,
      4,
    );
    ctx.fillStyle = "#0f8a7a";
    ctx.fillRect(
      this.position.x - radius,
      this.position.y - radius - 6,
      radius * 2 * hpRatio,
      4,
    );

    if (this.attackFxTimer > 0 && this.attackFxFrom && this.attackFxTo) {
      const alpha = Math.min(this.attackFxTimer / this.attackFxDuration, 1);
      ctx.globalAlpha = alpha;
      ctx.strokeStyle = "#f2c066";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(this.attackFxFrom.x, this.attackFxFrom.y);
      ctx.lineTo(this.attackFxTo.x, this.attackFxTo.y);
      ctx.stroke();
    }
    ctx.restore();
  }
}

const ENEMY_SPRITES = {
  drone: loadSprite("assets/Drone.png"),
  tank: loadSprite("assets/Tank.png"),
  phantom: loadSprite("assets/Phantom.png"),
  boss: loadSprite("assets/Boss.png"),
};

function loadSprite(path) {
  const img = new Image();
  img.src = path;
  return img;
}
