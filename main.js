import { CONFIG } from "./config.js";
import { Grid } from "./grid.js";
import { findPath } from "./pathfinding.js";
import { Enemy } from "./enemy.js";
import { Tower } from "./tower.js";
import { DDAEngine } from "./dda.js";
import { WaveManager } from "./waveManager.js";
import { UI } from "./ui.js";
import { DebugOverlay } from "./debug.js";
import { ScoreSystem } from "./score.js";

const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

canvas.width = CONFIG.grid.cols * CONFIG.grid.cellSize;
canvas.height = CONFIG.grid.rows * CONFIG.grid.cellSize;

function generateBlockedCells() {
  if (!CONFIG.map.randomize) {
    return CONFIG.map.blocked;
  }

  const totalCells = CONFIG.grid.cols * CONFIG.grid.rows;
  const targetCount = Math.max(0, Math.round(totalCells * CONFIG.map.density));
  const maxAttempts = CONFIG.map.maxAttempts || 30;

  for (let attempt = 0; attempt < maxAttempts; attempt += 1) {
    const blocked = [];
    const blockedSet = new Set();
    let tries = 0;

    while (blocked.length < targetCount && tries < targetCount * 12) {
      tries += 1;
      const x = Math.floor(Math.random() * CONFIG.grid.cols);
      const y = Math.floor(Math.random() * CONFIG.grid.rows);
      if ((x === CONFIG.start.x && y === CONFIG.start.y) || (x === CONFIG.goal.x && y === CONFIG.goal.y)) {
        continue;
      }
      if (x === CONFIG.start.x || x === CONFIG.goal.x) {
        continue;
      }
      const key = `${x},${y}`;
      if (blockedSet.has(key)) {
        continue;
      }
      blockedSet.add(key);
      blocked.push({ x, y });
    }

    const testGrid = new Grid({
      ...CONFIG,
      map: { ...CONFIG.map, blocked }
    });
    const { path } = findPath(testGrid, testGrid.start, testGrid.goal);
    if (path) {
      return blocked;
    }
  }

  return CONFIG.map.blocked;
}

const blockedCells = generateBlockedCells();
const grid = new Grid({
  ...CONFIG,
  map: { ...CONFIG.map, blocked: blockedCells }
});
const enemies = [];
const towers = [];
const dda = new DDAEngine(CONFIG);
const waveManager = new WaveManager(CONFIG);
const ui = new UI();
const debug = new DebugOverlay();
const score = new ScoreSystem();

const state = {
  hp: CONFIG.player.maxHp,
  ec: CONFIG.player.startEc,
  selectedTowerType: "blaster",
  selectedTower: null,
  running: true
};

function updateHud() {
  score.setEcRemaining(state.ec);
  ui.setHud({
    hp: state.hp,
    ec: state.ec,
    wave: waveManager.waveNumber,
    score: score.getScore()
  });
}

function spawnEnemy(typeKey) {
  const multipliers = dda.getMultipliers();
  const enemy = new Enemy(typeKey, grid, CONFIG, multipliers);
  const { path } = findPath(grid, grid.start, grid.goal);
  enemy.setPath(path || []);
  enemies.push(enemy);
  dda.onEnemySpawned();
}

function recalcAllEnemyPaths() {
  for (const enemy of enemies) {
    const startCell = enemy.getCell(grid.cellSize);
    const { path } = findPath(grid, startCell, grid.goal);
    enemy.setPath(path || []);
  }
}

function getBossBuffMultiplier(enemy) {
  for (const other of enemies) {
    if (!other.isBoss || other.state === "DEAD") {
      continue;
    }
    const dx = other.position.x - enemy.position.x;
    const dy = other.position.y - enemy.position.y;
    const dist = Math.hypot(dx, dy);
    if (dist <= CONFIG.boss.buffRadius * grid.cellSize) {
      return CONFIG.boss.buffMultiplier;
    }
  }
  return 1;
}

function onWaveCleared() {
  state.ec += CONFIG.wave.clearBonusEc;
  ui.setWaveButtonEnabled(true);
  const evalResult = dda.evaluateIfReady(waveManager.waveNumber, CONFIG.player.maxHp);
  if (evalResult) {
    ui.showNotification(evalResult.message);
  }
  score.setWaveSurvived(waveManager.waveNumber);
  waveManager.advanceWave();
  updateHud();
  if (waveManager.isComplete()) {
    endGame(true);
  }
}

function endGame(isWin) {
  state.running = false;
  ui.setWaveButtonEnabled(false);
  score.setWaveSurvived(Math.min(waveManager.waveNumber, CONFIG.wave.total));
  score.setEcRemaining(state.ec);
  const leaderboard = score.saveLeaderboard();
  const summary = `<p>Kills: ${score.kills}</p><p>Waves: ${score.wavesSurvived}</p><p>EC: ${state.ec}</p>`;
  ui.showEndScreen({
    title: isWin ? "You Win" : "Game Over",
    summary,
    leaderboard
  });
}

function handleCanvasClick(event) {
  if (!state.running) {
    return;
  }
  const rect = canvas.getBoundingClientRect();
  const scaleX = canvas.width / rect.width;
  const scaleY = canvas.height / rect.height;
  const x = (event.clientX - rect.left) * scaleX;
  const y = (event.clientY - rect.top) * scaleY;
  const cell = grid.worldToCell(x, y);
  if (!grid.isInside(cell.x, cell.y)) {
    return;
  }

  const existingTower = grid.getTowerAt(cell.x, cell.y);
  if (existingTower && !existingTower.destroyed) {
    state.selectedTower = existingTower;
    const info = `${existingTower.name} (Lv ${existingTower.level}) HP ${existingTower.hp}`;
    ui.setSelectedInfo(info, existingTower.level < 2, true);
    return;
  }

  state.selectedTower = null;
  ui.setSelectedInfo("None", false, false);

  if (!grid.isBuildable(cell.x, cell.y)) {
    ui.showNotification("Blocked terrain or invalid cell.");
    return;
  }

  const towerConfig = CONFIG.towers[state.selectedTowerType];
  if (state.ec < towerConfig.cost) {
    ui.showNotification("Not enough EC.");
    return;
  }

  grid.setTower(cell.x, cell.y, { temporary: true });
  const { path, visited } = findPath(grid, grid.start, grid.goal);
  grid.clearTower(cell.x, cell.y);
  debug.setData(visited, path);

  if (!path) {
    ui.showNotification("Placement blocks all paths.");
    return;
  }

  const tower = new Tower(state.selectedTowerType, cell, CONFIG, grid.cellSize);
  grid.setTower(cell.x, cell.y, tower);
  towers.push(tower);
  state.ec -= tower.cost;
  dda.onEcSpent(tower.cost);
  recalcAllEnemyPaths();
  updateHud();
}

function upgradeSelectedTower() {
  const tower = state.selectedTower;
  if (!tower || tower.level >= 2) {
    return;
  }
  const upgradeCost = Math.round(tower.cost * CONFIG.upgrade.costMultiplier);
  if (state.ec < upgradeCost) {
    ui.showNotification("Not enough EC to upgrade.");
    return;
  }
  if (tower.upgrade(CONFIG)) {
    state.ec -= upgradeCost;
    dda.onEcSpent(upgradeCost);
    updateHud();
    ui.setSelectedInfo(`${tower.name} (Lv ${tower.level}) HP ${tower.hp}`, tower.level < 2, true);
  }
}

function sellSelectedTower() {
  const tower = state.selectedTower;
  if (!tower) {
    return;
  }
  const refund = Math.round(tower.totalSpent * CONFIG.economy.sellRefund);
  state.ec += refund;
  tower.destroyed = true;
  grid.clearTower(tower.cell.x, tower.cell.y);
  towers.splice(towers.indexOf(tower), 1);
  state.selectedTower = null;
  ui.setSelectedInfo("None", false, false);
  recalcAllEnemyPaths();
  updateHud();
}

function onTowerEffective(tower) {
  dda.onTowerEffective(tower);
}

function onReachCore(enemy) {
  state.hp -= 1;
  dda.onHpLost(1);
  enemy.hp = 0;
  updateHud();
  if (state.hp <= 0) {
    endGame(false);
  }
}

function removeEnemy(enemy) {
  const index = enemies.indexOf(enemy);
  if (index !== -1) {
    enemies.splice(index, 1);
  }
}

ui.bindHandlers({
  onSelectTower: (typeKey) => {
    state.selectedTowerType = typeKey;
    ui.setTowerSelection(typeKey);
  },
  onStartWave: () => {
    if (waveManager.startWave()) {
      ui.setWaveButtonEnabled(false);
      ui.showNotification("Wave started.");
    }
  },
  onToggleDebug: () => {
    debug.enabled = !debug.enabled;
    ui.setDebugEnabled(debug.enabled);
  },
  onUpgrade: upgradeSelectedTower,
  onSell: sellSelectedTower,
  onRestart: () => window.location.reload()
});

ui.setTowerSelection(state.selectedTowerType);
ui.setDebugEnabled(debug.enabled);
ui.setSelectedInfo("None", false, false);
updateHud();

canvas.addEventListener("click", handleCanvasClick);

let lastTime = performance.now();
function loop(time) {
  const dt = Math.min((time - lastTime) / 1000, 0.05);
  lastTime = time;

  if (state.running) {
    waveManager.update(dt, {
      enemies,
      spawnEnemy,
      onWaveCleared
    });

    for (const tower of towers) {
      tower.update(dt, { enemies, grid, onTowerEffective });
    }

    for (const enemy of [...enemies]) {
      enemy.update(dt, {
        grid,
        waveActive: waveManager.active,
        onReachCore,
        onEnemyRemove: (target) => {
          if (target.hp <= 0 && !target.reachedGoal) {
            score.recordKill();
            state.ec += target.reward;
            dda.onEnemyKilled();
          }
          removeEnemy(target);
          updateHud();
        },
        getBossBuffMultiplier
      });
    }

    for (const tower of [...towers]) {
      if (tower.destroyed) {
        grid.clearTower(tower.cell.x, tower.cell.y);
        towers.splice(towers.indexOf(tower), 1);
        recalcAllEnemyPaths();
      }
    }
  }

  grid.render(ctx);
  for (const tower of towers) {
    tower.render(ctx, grid);
  }
  for (const enemy of enemies) {
    enemy.render(ctx, grid.cellSize);
  }
  debug.render(ctx, grid);

  requestAnimationFrame(loop);
}

requestAnimationFrame(loop);
