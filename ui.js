export class UI {
  constructor() {
    this.hpValue = document.getElementById("hpValue");
    this.ecValue = document.getElementById("ecValue");
    this.waveValue = document.getElementById("waveValue");
    this.scoreValue = document.getElementById("scoreValue");

    this.notification = document.getElementById("notification");
    this.startWaveBtn = document.getElementById("startWaveBtn");
    this.debugBtn = document.getElementById("debugBtn");

    this.towerButtons = Array.from(document.querySelectorAll(".tower-btn"));

    this.selectedInfo = document.getElementById("selectedInfo");
    this.upgradeBtn = document.getElementById("upgradeBtn");
    this.sellBtn = document.getElementById("sellBtn");

    this.endScreen = document.getElementById("endScreen");
    this.endTitle = document.getElementById("endTitle");
    this.endSummary = document.getElementById("endSummary");
    this.leaderboardList = document.getElementById("leaderboardList");
    this.restartBtn = document.getElementById("restartBtn");
  }

  bindHandlers(handlers) {
    this.startWaveBtn.addEventListener("click", handlers.onStartWave);
    this.debugBtn.addEventListener("click", handlers.onToggleDebug);
    this.upgradeBtn.addEventListener("click", handlers.onUpgrade);
    this.sellBtn.addEventListener("click", handlers.onSell);
    this.restartBtn.addEventListener("click", handlers.onRestart);

    for (const button of this.towerButtons) {
      button.addEventListener("click", () => {
        handlers.onSelectTower(button.dataset.tower);
      });
    }
  }

  setHud({ hp, ec, wave, score }) {
    this.hpValue.textContent = hp;
    this.ecValue.textContent = ec;
    this.waveValue.textContent = wave;
    this.scoreValue.textContent = score;
  }

  setTowerSelection(typeKey) {
    for (const button of this.towerButtons) {
      button.classList.toggle("active", button.dataset.tower === typeKey);
    }
  }

  setSelectedInfo(text, canUpgrade, canSell) {
    this.selectedInfo.textContent = text;
    this.upgradeBtn.disabled = !canUpgrade;
    this.sellBtn.disabled = !canSell;
  }

  setWaveButtonEnabled(enabled) {
    this.startWaveBtn.disabled = !enabled;
  }

  setDebugEnabled(enabled) {
    this.debugBtn.textContent = enabled ? "Debug: On" : "Debug: Off";
  }

  showNotification(message) {
    if (!message) {
      return;
    }
    this.notification.textContent = message;
    this.notification.classList.add("show");
    clearTimeout(this.notificationTimer);
    this.notificationTimer = setTimeout(() => {
      this.notification.classList.remove("show");
    }, 1800);
  }

  showEndScreen({ title, summary, leaderboard }) {
    this.endTitle.textContent = title;
    this.endSummary.innerHTML = summary;
    this.leaderboardList.innerHTML = "";
    for (const entry of leaderboard) {
      const item = document.createElement("li");
      item.textContent = `${entry.score} pts - ${entry.waves} waves - ${entry.ec} EC`;
      this.leaderboardList.appendChild(item);
    }
    this.endScreen.classList.remove("hidden");
  }
}
