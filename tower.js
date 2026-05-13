export class Tower {
  constructor(typeKey, cell, config, cellSize) {
    const base = config.towers[typeKey];
    this.typeKey = typeKey;
    this.name = base.name;
    this.cost = base.cost;
    this.level = 1;
    this.cell = { ...cell };
    this.range = base.range * cellSize;
    this.damage = base.damage;
    this.fireRate = base.fireRate;
    this.cooldown = 0;
    this.color = base.color;
    this.hp = base.hp;
    this.maxHp = base.hp;
    this.splashRadius = base.splashRadius ? base.splashRadius * cellSize : 0;
    this.slowMultiplier = base.slowMultiplier || 1;
    this.slowDuration = base.slowDuration || 0;
    this.destroyed = false;
    this.totalSpent = base.cost;
    this.hasDealtDamage = false;
    this.shotTimer = 0;
    this.shotFrom = null;
    this.shotTo = null;
    this.shotIsSplash = false;
    this.shotRadius = 0;
  }

  update(dt, context) {
    if (this.destroyed) {
      return;
    }

    this.cooldown -= dt;
    if (this.shotTimer > 0) {
      this.shotTimer -= dt;
      if (this.shotTimer <= 0) {
        this.shotFrom = null;
        this.shotTo = null;
      }
    }
    if (this.cooldown > 0) {
      return;
    }

    const origin = context.grid.cellToWorldCenter(this.cell.x, this.cell.y);
    let target = null;
    let minDist = Infinity;

    for (const enemy of context.enemies) {
      if (enemy.state === "DEAD") {
        continue;
      }
      const dx = enemy.position.x - origin.x;
      const dy = enemy.position.y - origin.y;
      const dist = Math.hypot(dx, dy);
      if (dist <= this.range && dist < minDist) {
        minDist = dist;
        target = enemy;
      }
    }

    if (!target) {
      return;
    }

    this.cooldown = 1 / this.fireRate;
    this.shotTimer = 0.12;
    this.shotFrom = origin;
    this.shotTo = { x: target.position.x, y: target.position.y };
    this.shotIsSplash = this.splashRadius > 0;
    this.shotRadius = this.splashRadius;

    if (this.splashRadius > 0) {
      for (const enemy of context.enemies) {
        const dx = enemy.position.x - target.position.x;
        const dy = enemy.position.y - target.position.y;
        const dist = Math.hypot(dx, dy);
        if (dist <= this.splashRadius) {
          enemy.takeDamage(this.damage);
        }
      }
    } else {
      target.takeDamage(this.damage);
      if (this.slowDuration > 0) {
        const multiplier = target.typeKey === "phantom"
          ? Math.max(1 - (1 - this.slowMultiplier) * 0.5, 0.8)
          : this.slowMultiplier;
        target.applySlow(multiplier, this.slowDuration);
      }
    }

    if (!this.hasDealtDamage) {
      this.hasDealtDamage = true;
      context.onTowerEffective(this);
    }
  }

  upgrade(config) {
    if (this.level >= 2) {
      return false;
    }
    this.level = 2;
    this.damage = Math.round(this.damage * config.upgrade.damageMultiplier);
    this.range = this.range * config.upgrade.rangeMultiplier;
    this.maxHp = Math.round(this.maxHp * 1.2);
    this.hp = this.maxHp;
    this.totalSpent = this.totalSpent + Math.round(this.cost * config.upgrade.costMultiplier);
    return true;
  }

  takeDamage(amount) {
    this.hp -= amount;
    if (this.hp <= 0) {
      this.destroyed = true;
    }
  }

  render(ctx, grid) {
    if (this.destroyed) {
      return;
    }
    const pos = grid.cellToWorldCenter(this.cell.x, this.cell.y);
    ctx.save();
    ctx.fillStyle = this.color;
    ctx.fillRect(
      pos.x - grid.cellSize * 0.3,
      pos.y - grid.cellSize * 0.3,
      grid.cellSize * 0.6,
      grid.cellSize * 0.6
    );

    if (this.level > 1) {
      ctx.strokeStyle = "#0f8a7a";
      ctx.lineWidth = 2;
      ctx.strokeRect(
        pos.x - grid.cellSize * 0.32,
        pos.y - grid.cellSize * 0.32,
        grid.cellSize * 0.64,
        grid.cellSize * 0.64
      );
    }

    if (this.shotTimer > 0 && this.shotFrom && this.shotTo) {
      const alpha = Math.min(this.shotTimer / 0.12, 1);
      ctx.globalAlpha = alpha;
      ctx.strokeStyle = this.color;
      ctx.lineWidth = this.shotIsSplash ? 2 : 3;
      ctx.beginPath();
      ctx.moveTo(this.shotFrom.x, this.shotFrom.y);
      ctx.lineTo(this.shotTo.x, this.shotTo.y);
      ctx.stroke();

      if (this.shotIsSplash) {
        ctx.strokeStyle = this.color;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(this.shotTo.x, this.shotTo.y, this.shotRadius * (1 - alpha * 0.4), 0, Math.PI * 2);
        ctx.stroke();
      }
    }
    ctx.restore();
  }
}
