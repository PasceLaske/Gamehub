const boardEl = document.getElementById("board");
const turnEl = document.getElementById("turn");
const scoreEl = document.getElementById("score");
const highscoreEl = document.getElementById("highscore");
const overlay = document.getElementById("overlay");
const overlayTitle = document.getElementById("overlayTitle");
const resumeBtn = document.getElementById("resumeBtn");

const ROWS = 6;
const COLS = 7;

const stats = Storage.get("stats", {});
let highscore = stats.Connect4 || 0;
highscoreEl.textContent = "High Score: " + highscore;

let grid;
let current;
let paused = false;
let redWins = 0;
let yellowWins = 0;
const playerColor = "red";
const botColor = "yellow";

document.getElementById("restartBtn").onclick = restart;
document.getElementById("backBtn").onclick = () =>
  (location.href = "../../index.html");
resumeBtn.onclick = resume;

function showMenu(title = "Menu", canResume = true) {
  paused = true;
  overlayTitle.textContent = title;
  resumeBtn.classList.toggle("hidden", !canResume);
  overlay.classList.remove("hidden");
}

function resume() {
  if (overlay.classList.contains("hidden")) return;
  paused = false;
  overlay.classList.add("hidden");
  if (current === botColor) {
    setTimeout(botMove, 200);
  }
}

function initBoard() {
  boardEl.innerHTML = "";
  for (let i = 0; i < ROWS * COLS; i++) {
    const cell = document.createElement("div");
    cell.className = "cell";
    cell.dataset.index = i;
    boardEl.appendChild(cell);
  }
}

function resetGrid() {
  grid = Array.from({ length: ROWS }, () => Array(COLS).fill(""));
  current = "red";
  turnEl.textContent = "Turn: Red";
  scoreEl.textContent = `Score: Red ${redWins} - Yellow ${yellowWins}`;
  Array.from(boardEl.children).forEach(cell => {
    cell.classList.remove("red", "yellow");
  });
}

function getCell(row, col) {
  return boardEl.children[row * COLS + col];
}

function checkWin(row, col) {
  const color = grid[row][col];
  const dirs = [
    { r: 0, c: 1 },
    { r: 1, c: 0 },
    { r: 1, c: 1 },
    { r: 1, c: -1 }
  ];

  return dirs.some(dir => {
    let count = 1;
    for (let i = 1; i < 4; i++) {
      const r = row + dir.r * i;
      const c = col + dir.c * i;
      if (r < 0 || r >= ROWS || c < 0 || c >= COLS) break;
      if (grid[r][c] !== color) break;
      count++;
    }
    for (let i = 1; i < 4; i++) {
      const r = row - dir.r * i;
      const c = col - dir.c * i;
      if (r < 0 || r >= ROWS || c < 0 || c >= COLS) break;
      if (grid[r][c] !== color) break;
      count++;
    }
    return count >= 4;
  });
}

function checkWinAt(testGrid, row, col, color) {
  const dirs = [
    { r: 0, c: 1 },
    { r: 1, c: 0 },
    { r: 1, c: 1 },
    { r: 1, c: -1 }
  ];

  return dirs.some(dir => {
    let count = 1;
    for (let i = 1; i < 4; i++) {
      const r = row + dir.r * i;
      const c = col + dir.c * i;
      if (r < 0 || r >= ROWS || c < 0 || c >= COLS) break;
      if (testGrid[r][c] !== color) break;
      count++;
    }
    for (let i = 1; i < 4; i++) {
      const r = row - dir.r * i;
      const c = col - dir.c * i;
      if (r < 0 || r >= ROWS || c < 0 || c >= COLS) break;
      if (testGrid[r][c] !== color) break;
      count++;
    }
    return count >= 4;
  });
}

function getAvailableRow(col, testGrid = grid) {
  for (let row = ROWS - 1; row >= 0; row--) {
    if (!testGrid[row][col]) return row;
  }
  return null;
}

function findWinningColumn(color) {
  for (let col = 0; col < COLS; col++) {
    const row = getAvailableRow(col);
    if (row === null) continue;
    grid[row][col] = color;
    const win = checkWinAt(grid, row, col, color);
    grid[row][col] = "";
    if (win) return col;
  }
  return null;
}

function botMove() {
  if (paused || current !== botColor) return;

  let col = findWinningColumn(botColor);
  if (col === null) col = findWinningColumn(playerColor);
  if (col === null) col = pickBestColumn(botColor, 2);
  if (col === null) return;

  dropDisc(col);
}

function dropDisc(col) {
  if (paused) return;
  if (!overlay.classList.contains("hidden")) return;
  for (let row = ROWS - 1; row >= 0; row--) {
    if (!grid[row][col]) {
      grid[row][col] = current;
      getCell(row, col).classList.add(current);

      if (checkWin(row, col)) {
        if (current === "red") {
          redWins++;
          if (redWins > highscore) {
            highscore = redWins;
            stats.Connect4 = highscore;
            Storage.set("stats", stats);
            highscoreEl.textContent = "High Score: " + highscore;
          }
        } else {
          yellowWins++;
        }
        scoreEl.textContent = `Score: Red ${redWins} - Yellow ${yellowWins}`;
        showMenu(`${current === "red" ? "Red" : "Yellow"} Wins`, false);
        return;
      }

      if (grid.flat().every(cell => cell)) {
        showMenu("Draw", false);
        return;
      }

      current = current === "red" ? "yellow" : "red";
      turnEl.textContent = `Turn: ${current === "red" ? "Red" : "Yellow"}`;
      if (current === botColor) {
        setTimeout(botMove, 200);
      }
      return;
    }
  }
}

boardEl.addEventListener("click", e => {
  const target = e.target;
  if (!target.classList.contains("cell")) return;
  if (!overlay.classList.contains("hidden")) return;
  if (current !== playerColor) return;
  const index = Number(target.dataset.index);
  const col = index % COLS;
  dropDisc(col);
});

document.addEventListener("keydown", e => {
  if (e.key === "Escape") {
    showMenu();
  }
});

function restart() {
  paused = false;
  overlay.classList.add("hidden");
  resetGrid();
  if (current === botColor) {
    setTimeout(botMove, 200);
  }
}

function pickBestColumn(color, depth) {
  let bestScore = -Infinity;
  let bestCol = null;
  for (let col = 0; col < COLS; col++) {
    const row = getAvailableRow(col);
    if (row === null) continue;
    grid[row][col] = color;
    const score = minimax(depth - 1, false, color);
    grid[row][col] = "";
    if (score > bestScore) {
      bestScore = score;
      bestCol = col;
    }
  }
  return bestCol;
}

function minimax(depth, maximizing, bot) {
  const opponent = bot === "red" ? "yellow" : "red";
  const winnerBot = findWinningColumn(bot);
  const winnerOpp = findWinningColumn(opponent);
  if (winnerBot !== null) return 10000 + depth;
  if (winnerOpp !== null) return -10000 - depth;

  if (depth === 0) return scorePosition(bot);

  if (maximizing) {
    let best = -Infinity;
    for (let col = 0; col < COLS; col++) {
      const row = getAvailableRow(col);
      if (row === null) continue;
      grid[row][col] = bot;
      const score = minimax(depth - 1, false, bot);
      grid[row][col] = "";
      best = Math.max(best, score);
    }
    return best;
  }

  let best = Infinity;
  for (let col = 0; col < COLS; col++) {
    const row = getAvailableRow(col);
    if (row === null) continue;
    grid[row][col] = opponent;
    const score = minimax(depth - 1, true, bot);
    grid[row][col] = "";
    best = Math.min(best, score);
  }
  return best;
}

function scorePosition(color) {
  const opponent = color === "red" ? "yellow" : "red";
  let score = 0;

  const centerCol = Math.floor(COLS / 2);
  for (let row = 0; row < ROWS; row++) {
    if (grid[row][centerCol] === color) score += 4;
    if (grid[row][centerCol] === opponent) score -= 3;
  }

  score += countWindows(color, 4) * 200;
  score += countWindows(color, 3) * 12;
  score += countWindows(color, 2) * 4;

  score -= countWindows(opponent, 3) * 10;
  score -= countWindows(opponent, 2) * 2;

  return score;
}

function countWindows(color, needed) {
  let count = 0;

  for (let row = 0; row < ROWS; row++) {
    for (let col = 0; col <= COLS - 4; col++) {
      const window = [0, 1, 2, 3].map(i => grid[row][col + i]);
      if (isWindow(window, color, needed)) count++;
    }
  }

  for (let col = 0; col < COLS; col++) {
    for (let row = 0; row <= ROWS - 4; row++) {
      const window = [0, 1, 2, 3].map(i => grid[row + i][col]);
      if (isWindow(window, color, needed)) count++;
    }
  }

  for (let row = 0; row <= ROWS - 4; row++) {
    for (let col = 0; col <= COLS - 4; col++) {
      const window = [0, 1, 2, 3].map(i => grid[row + i][col + i]);
      if (isWindow(window, color, needed)) count++;
    }
  }

  for (let row = 3; row < ROWS; row++) {
    for (let col = 0; col <= COLS - 4; col++) {
      const window = [0, 1, 2, 3].map(i => grid[row - i][col + i]);
      if (isWindow(window, color, needed)) count++;
    }
  }

  return count;
}

function isWindow(window, color, needed) {
  const colors = window.filter(cell => cell === color).length;
  const empty = window.filter(cell => cell === "").length;
  return colors === needed && empty === 4 - needed;
}

initBoard();
resetGrid();
