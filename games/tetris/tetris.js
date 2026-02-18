const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d");

const COLS = 10;
const ROWS = 20;
const SIZE = canvas.width / COLS;

const scoreEl = document.getElementById("score");
const highscoreEl = document.getElementById("highscore");
const overlay = document.getElementById("overlay");
const overlayTitle = document.getElementById("overlayTitle");
const resumeBtn = document.getElementById("resumeBtn");

const stats = Storage.get("stats", {});
let highscore = stats.Tetris || 0;
highscoreEl.textContent = "High Score: " + highscore;

const SHAPES = [
  { name: "I", color: "#00e5ff", matrix: [[1, 1, 1, 1]] },
  { name: "O", color: "#ffe600", matrix: [[1, 1], [1, 1]] },
  { name: "T", color: "#b862ff", matrix: [[0, 1, 0], [1, 1, 1]] },
  { name: "S", color: "#38e038", matrix: [[0, 1, 1], [1, 1, 0]] },
  { name: "Z", color: "#ff4f4f", matrix: [[1, 1, 0], [0, 1, 1]] },
  { name: "J", color: "#4f6bff", matrix: [[1, 0, 0], [1, 1, 1]] },
  { name: "L", color: "#ff9f43", matrix: [[0, 0, 1], [1, 1, 1]] }
];

let grid;
let active;
let score = 0;
let dropInterval = 600;
let dropTimer;
let paused = false;

document.getElementById("restartBtn").onclick = restart;
document.getElementById("backBtn").onclick = () =>
  (location.href = "../../index.html");
resumeBtn.onclick = resume;
overlay.classList.add("hidden");

function showMenu(title = "Menu", canResume = true) {
  paused = true;
  overlayTitle.textContent = title;
  resumeBtn.classList.toggle("hidden", !canResume);
  overlay.classList.remove("hidden");
}

function resetGrid() {
  grid = Array.from({ length: ROWS }, () => Array(COLS).fill(null));
}

function spawnPiece() {
  const shape = SHAPES[Math.floor(Math.random() * SHAPES.length)];
  active = {
    matrix: shape.matrix.map(row => row.slice()),
    color: shape.color,
    x: Math.floor((COLS - shape.matrix[0].length) / 2),
    y: 0
  };

  if (collides(active.matrix, active.x, active.y)) {
    gameOver();
  }
}

function collides(matrix, offsetX, offsetY) {
  for (let y = 0; y < matrix.length; y++) {
    for (let x = 0; x < matrix[y].length; x++) {
      if (!matrix[y][x]) continue;
      const nx = offsetX + x;
      const ny = offsetY + y;
      if (nx < 0 || nx >= COLS || ny >= ROWS) return true;
      if (ny >= 0 && grid[ny][nx]) return true;
    }
  }
  return false;
}

function merge() {
  active.matrix.forEach((row, y) => {
    row.forEach((value, x) => {
      if (value && active.y + y >= 0) {
        grid[active.y + y][active.x + x] = active.color;
      }
    });
  });
}

function clearLines() {
  let cleared = 0;
  for (let y = ROWS - 1; y >= 0; y--) {
    if (grid[y].every(cell => cell)) {
      grid.splice(y, 1);
      grid.unshift(Array(COLS).fill(null));
      cleared++;
      y++;
    }
  }

  if (cleared > 0) {
    score += cleared * 100;
    scoreEl.textContent = "Score: " + score;
    dropInterval = Math.max(120, dropInterval - cleared * 20);
    restartDropTimer();
  }
}

function rotate(matrix) {
  return matrix[0].map((_, i) =>
    matrix.map(row => row[i]).reverse()
  );
}

function move(dx, dy) {
  if (!active) return;
  const nextX = active.x + dx;
  const nextY = active.y + dy;
  if (!collides(active.matrix, nextX, nextY)) {
    active.x = nextX;
    active.y = nextY;
    return true;
  }
  return false;
}

function lockPiece() {
  merge();
  clearLines();
  spawnPiece();
}

function tick() {
  if (paused) return;
  if (!move(0, 1)) {
    lockPiece();
  }
  draw();
}

function drawCell(x, y, color) {
  ctx.fillStyle = color;
  ctx.fillRect(x * SIZE + 1, y * SIZE + 1, SIZE - 2, SIZE - 2);
}

function draw() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  for (let y = 0; y < ROWS; y++) {
    for (let x = 0; x < COLS; x++) {
      if (grid[y][x]) drawCell(x, y, grid[y][x]);
    }
  }

  if (!active) return;
  active.matrix.forEach((row, y) => {
    row.forEach((value, x) => {
      if (value) drawCell(active.x + x, active.y + y, active.color);
    });
  });
}

function restartDropTimer() {
  clearInterval(dropTimer);
  dropTimer = setInterval(tick, dropInterval);
}

function softDrop() {
  if (!active) return;
  if (!move(0, 1)) lockPiece();
  draw();
}

function hardDrop() {
  if (!active) return;
  while (move(0, 1)) {
    // drop until collision
  }
  lockPiece();
  draw();
}

function rotateActive() {
  if (!active) return;
  const rotated = rotate(active.matrix);
  if (!collides(rotated, active.x, active.y)) {
    active.matrix = rotated;
  }
  draw();
}

function gameOver() {
  clearInterval(dropTimer);
  if (score > highscore) {
    highscore = score;
    stats.Tetris = score;
    Storage.set("stats", stats);
    highscoreEl.textContent = "High Score: " + highscore;
  }
  showMenu("Game Over", false);
}

function restart() {
  score = 0;
  scoreEl.textContent = "Score: 0";
  dropInterval = 600;
  paused = false;
  overlay.classList.add("hidden");
  resetGrid();
  spawnPiece();
  restartDropTimer();
  draw();
}

function resume() {
  if (overlay.classList.contains("hidden")) return;
  paused = false;
  overlay.classList.add("hidden");
}

document.addEventListener("keydown", e => {
  if (e.key === "Escape") {
    showMenu();
    return;
  }
  if (!overlay.classList.contains("hidden")) return;
  if (!active) return;
  if (e.key === "ArrowLeft") move(-1, 0);
  if (e.key === "ArrowRight") move(1, 0);
  if (e.key === "ArrowDown") softDrop();
  if (e.key.toLowerCase() === "p") paused = !paused;
  if (e.key === "ArrowUp") rotateActive();
  draw();
});

document.querySelectorAll(".touch-btn").forEach(btn => {
  btn.addEventListener("click", () => {
    const action = btn.dataset.action;
    if (action === "pause") {
      paused = !paused;
      return;
    }
    if (!overlay.classList.contains("hidden") || !active) return;
    if (action === "left") move(-1, 0);
    if (action === "right") move(1, 0);
    if (action === "down") softDrop();
    if (action === "drop") hardDrop();
    if (action === "rotate") rotateActive();
    draw();
  });
});

resetGrid();
spawnPiece();
restartDropTimer();
draw();
