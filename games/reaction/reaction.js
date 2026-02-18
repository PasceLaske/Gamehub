const timerEl = document.getElementById("timer");
const scoreEl = document.getElementById("score");
const highscoreEl = document.getElementById("highscore");
const arena = document.getElementById("arena");
const target = document.getElementById("target");
const overlay = document.getElementById("overlay");
const overlayTitle = document.getElementById("overlayTitle");
const resumeBtn = document.getElementById("resumeBtn");
const startBtn = document.getElementById("startBtn");
const restartBtn = document.getElementById("restartBtn");
const backBtn = document.getElementById("backBtn");

const stats = Storage.get("stats", {});
let highscore = stats.ReactionRush || 0;
let score = 0;
let timeLeft = 30;
let running = false;
let paused = false;
let timerId = null;

highscoreEl.textContent = "High Score: " + highscore;

function updateHud() {
  scoreEl.textContent = "Score: " + score;
  timerEl.textContent = "Time: " + timeLeft;
}

function moveTarget() {
  const maxX = arena.clientWidth - target.offsetWidth;
  const maxY = arena.clientHeight - target.offsetHeight;
  const x = Math.floor(Math.random() * Math.max(maxX, 1));
  const y = Math.floor(Math.random() * Math.max(maxY, 1));
  target.style.left = x + "px";
  target.style.top = y + "px";
}

function showOverlay(title, showResume) {
  overlayTitle.textContent = title;
  resumeBtn.classList.toggle("hidden", !showResume);
  overlay.classList.remove("hidden");
}

function hideOverlay() {
  overlay.classList.add("hidden");
}

function stopTimer() {
  if (timerId !== null) {
    clearInterval(timerId);
    timerId = null;
  }
}

function endGame() {
  running = false;
  paused = false;
  stopTimer();

  if (score > highscore) {
    highscore = score;
    stats.ReactionRush = highscore;
    Storage.set("stats", stats);
    highscoreEl.textContent = "High Score: " + highscore;
  }

  showOverlay("Time up - Score " + score, false);
}

function tick() {
  if (!running || paused) return;
  timeLeft -= 1;
  updateHud();
  if (timeLeft <= 0) {
    endGame();
  }
}

function startGame() {
  score = 0;
  timeLeft = 30;
  running = true;
  paused = false;
  updateHud();
  hideOverlay();
  moveTarget();
  stopTimer();
  timerId = setInterval(tick, 1000);
}

function restartGame() {
  startGame();
}

function pauseGame() {
  if (!running || paused) return;
  paused = true;
  showOverlay("Paused", true);
}

function resumeGame() {
  if (!running || !paused) return;
  paused = false;
  hideOverlay();
}

target.addEventListener("click", () => {
  if (!running || paused) return;
  score += 1;
  updateHud();
  moveTarget();
});

startBtn.addEventListener("click", startGame);
restartBtn.addEventListener("click", restartGame);
resumeBtn.addEventListener("click", resumeGame);
backBtn.addEventListener("click", () => {
  location.href = "../../index.html";
});

document.addEventListener("keydown", e => {
  if (e.key === "Escape") {
    pauseGame();
  }
});

window.addEventListener("resize", () => {
  if (running) {
    moveTarget();
  }
});

updateHud();
moveTarget();
showOverlay("Click Start to play", false);