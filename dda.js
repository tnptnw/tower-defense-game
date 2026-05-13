export class DDAEngine {
  constructor(config) {
    this.config = config;
    this.resetWindow();
    this.speedMultiplier = 1.0;
    this.hpMultiplier = 1.0;
  }

  resetWindow() {
    this.enemiesSpawned = 0;
    this.enemiesKilled = 0;
    this.hpLost = 0;
    this.ecSpent = 0;
    this.ecEffectiveSpent = 0;
    this.effectiveTowerSet = new Set();
  }

  onEnemySpawned() {
    this.enemiesSpawned += 1;
  }

  onEnemyKilled() {
    this.enemiesKilled += 1;
  }

  onHpLost(amount) {
    this.hpLost += amount;
  }

  onEcSpent(amount) {
    this.ecSpent += amount;
  }

  onTowerEffective(tower) {
    if (this.effectiveTowerSet.has(tower)) {
      return;
    }
    this.effectiveTowerSet.add(tower);
    this.ecEffectiveSpent += tower.totalSpent;
  }

  evaluateIfReady(waveNumber, maxHp) {
    if (waveNumber % this.config.dda.windowWaves !== 0) {
      return null;
    }

    const killRate = this.enemiesSpawned > 0
      ? this.enemiesKilled / this.enemiesSpawned
      : 0;
    const hpLostRate = maxHp > 0 ? this.hpLost / maxHp : 0;

    // DDA formula: weight kill rate and remaining HP to compute difficulty score.
    const difficultyScore =
      (killRate * this.config.dda.weights.kill) +
      ((1 - hpLostRate) * this.config.dda.weights.hp);

    let tier = this.config.dda.tiers[this.config.dda.tiers.length - 1];
    for (const entry of this.config.dda.tiers) {
      if (difficultyScore >= entry.min) {
        tier = entry;
        break;
      }
    }

    this.speedMultiplier = this.clamp(
      this.speedMultiplier * tier.speed,
      this.config.dda.caps.speed.min,
      this.config.dda.caps.speed.max
    );
    this.hpMultiplier = this.clamp(
      this.hpMultiplier * tier.hp,
      this.config.dda.caps.hp.min,
      this.config.dda.caps.hp.max
    );

    this.resetWindow();
    return {
      score: difficultyScore,
      message: tier.message
    };
  }

  getMultipliers() {
    return {
      speed: this.speedMultiplier,
      hp: this.hpMultiplier
    };
  }

  clamp(value, min, max) {
    return Math.min(Math.max(value, min), max);
  }
}
