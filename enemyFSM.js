export const EnemyState = {
  IDLE: "IDLE",
  MOVE: "MOVE",
  ATTACK: "ATTACK",
  DEAD: "DEAD",
};

function getAdjacentTower(enemy, grid) {
  const cell = enemy.getCell(grid);
  const dirs = [
    { x: 1, y: 0 },
    { x: -1, y: 0 },
    { x: 0, y: 1 },
    { x: 0, y: -1 },
  ];

  for (const dir of dirs) {
    const nx = cell.x + dir.x;
    const ny = cell.y + dir.y;
    const tower = grid.getTowerAt(nx, ny);
    if (tower) {
      return tower;
    }
  }

  return null;
}

export function runFSM(enemy, context, dt) {
  if (enemy.state !== EnemyState.DEAD && enemy.hp <= 0) {
    // FSM transition: any state to DEAD when HP drops to zero.
    enemy.state = EnemyState.DEAD;
    enemy.deathTimer = 0.35;
    return;
  }

  switch (enemy.state) {
    case EnemyState.IDLE: {
      if (context.waveActive) {
        // FSM transition: IDLE to MOVE when a wave starts.
        enemy.state = EnemyState.MOVE;
      }
      break;
    }
    case EnemyState.MOVE: {
      if (enemy.isTank || enemy.typeKey === "phantom" || enemy.isBoss) {
        const tower = getAdjacentTower(enemy, context.grid);
        if (tower) {
          if (enemy.isTank) {
            // FSM transition: MOVE to ATTACK when a tank sees a nearby tower.
            enemy.state = EnemyState.ATTACK;
            enemy.targetTower = tower;
            enemy.attackCooldown = 0;
            break;
          }
          enemy.triggerAttackFx(tower, context.grid);
        }
      }
      enemy.moveAlongPath(dt, context);
      if (enemy.reachedGoal) {
        context.onReachCore(enemy);
      }
      break;
    }
    case EnemyState.ATTACK: {
      const target = enemy.targetTower;
      if (!target || target.destroyed) {
        // FSM transition: ATTACK to MOVE when the tower is destroyed.
        enemy.state = EnemyState.MOVE;
        enemy.targetTower = null;
        break;
      }
      enemy.attackTower(dt, target, context.grid);
      break;
    }
    case EnemyState.DEAD: {
      enemy.deathTimer -= dt;
      if (enemy.deathTimer <= 0) {
        context.onEnemyRemove(enemy);
      }
      break;
    }
    default:
      break;
  }
}
