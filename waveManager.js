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
    const scaled =
      1 + this.config.wave.countScalePerWave * (this.waveNumber - 1);
    this.toSpawn = Math.round(
      (base + increment * (this.waveNumber - 1)) * scaled,
    );
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
      const interval = Math.max(
        this.config.wave.minSpawnIntervalMs,
        this.config.wave.spawnIntervalMs *
          Math.pow(this.config.wave.spawnIntervalScale, this.waveNumber - 1),
      );
      this.spawnTimer = interval;
    }

    if (this.toSpawn === 0 && this.bossPending) {
      context.spawnEnemy("boss");
      this.bossPending = false;
    }

    if (
      this.toSpawn === 0 &&
      !this.bossPending &&
      context.enemies.length === 0
    ) {
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
    const t = Math.min((this.waveNumber - 4) / 6, 1);
    const tankChance = 0.35 + 0.25 * t;
    const phantomChance = 0.1 + 0.25 * t;
    const roll = Math.random();
    if (roll < tankChance) {
      return "tank";
    }
    if (roll < tankChance + phantomChance) {
      return "phantom";
    }
    return "drone";
  }

  advanceWave() {
    this.waveNumber += 1;
  }

  isComplete() {
    return this.waveNumber > this.config.wave.total;
  }
}
