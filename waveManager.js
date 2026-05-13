export class WaveManager {
  constructor(config) {
    this.config = config;
    this.waveNumber = 1;
    this.active = false;
    this.toSpawn = 0;
    this.spawnTimer = 0;
    this.bossPending = false;
  }

  startWave() {
    if (this.active) {
      return false;
    }
    const base = this.config.wave.baseCount;
    const increment = this.config.wave.increment;
    this.toSpawn = base + increment * (this.waveNumber - 1);
    this.spawnTimer = 0;
    this.active = true;
    this.bossPending = this.config.wave.bossWaves.includes(this.waveNumber);
    return true;
  }

  update(dt, context) {
    if (!this.active) {
      return;
    }

    this.spawnTimer -= dt * 1000;
    if (this.toSpawn > 0 && this.spawnTimer <= 0) {
      const typeKey = this.pickEnemyType();
      context.spawnEnemy(typeKey);
      this.toSpawn -= 1;
      this.spawnTimer = this.config.wave.spawnIntervalMs;
    }

    if (this.toSpawn === 0 && this.bossPending) {
      context.spawnEnemy("boss");
      this.bossPending = false;
    }

    if (this.toSpawn === 0 && !this.bossPending && context.enemies.length === 0) {
      this.active = false;
      context.onWaveCleared();
    }
  }

  pickEnemyType() {
    if (this.waveNumber <= 2) {
      return "drone";
    }
    if (this.waveNumber <= 4) {
      return Math.random() < 0.7 ? "drone" : "tank";
    }
    return Math.random() < 0.55 ? "drone" : (Math.random() < 0.6 ? "tank" : "phantom");
  }

  advanceWave() {
    this.waveNumber += 1;
  }

  isComplete() {
    return this.waveNumber > this.config.wave.total;
  }
}
