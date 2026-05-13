export class ScoreSystem {
  constructor() {
    this.kills = 0;
    this.wavesSurvived = 0;
    this.ecRemaining = 0;
  }

  recordKill() {
    this.kills += 1;
  }

  setWaveSurvived(wave) {
    this.wavesSurvived = wave;
  }

  setEcRemaining(ec) {
    this.ecRemaining = ec;
  }

  getScore() {
    return this.kills * 5 + this.wavesSurvived * 20 + this.ecRemaining;
  }

  loadLeaderboard() {
    const raw = localStorage.getItem("towermind_leaderboard");
    if (!raw) {
      return [];
    }
    try {
      return JSON.parse(raw);
    } catch {
      return [];
    }
  }

  saveLeaderboard() {
    const leaderboard = this.loadLeaderboard();
    const entry = {
      score: this.getScore(),
      waves: this.wavesSurvived,
      ec: this.ecRemaining
    };
    leaderboard.push(entry);
    leaderboard.sort((a, b) => b.score - a.score);
    const trimmed = leaderboard.slice(0, 5);
    localStorage.setItem("towermind_leaderboard", JSON.stringify(trimmed));
    return trimmed;
  }
}
