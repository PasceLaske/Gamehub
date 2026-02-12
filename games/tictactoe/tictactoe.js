const cells = Array.from(document.querySelectorAll(".cell"));
const turnEl = document.getElementById("turn");
const scoreEl = document.getElementById("score");
const highscoreEl = document.getElementById("highscore");
const overlay = document.getElementById("overlay");
const overlayTitle = document.getElementById("overlayTitle");
const resumeBtn = document.getElementById("resumeBtn");

const stats = Storage.get("stats", {});
let highscore = stats.TicTacToe || 0;
highscoreEl.textContent = "High Score: " + highscore;

let board;
let current;
let paused = false;
let xWins = 0;
let oWins = 0;
const playerMark = "X";
const botMark = "O";

document.getElementById("restartBtn").onclick = restart;
document.getElementById("backBtn").onclick = () =>
  (location.href = "../../index.html");
resumeBtn.onclick = resume;

function restart() {
  init();
}

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
  if (current === botMark) {
    setTimeout(botMove, 200);
  }
}

function init() {
  board = Array(9).fill("");
  current = "X";
  paused = false;
  overlay.classList.add("hidden");
  turnEl.textContent = "Turn: " + current;
  scoreEl.textContent = `Score: X ${xWins} - O ${oWins}`;
  cells.forEach(cell => {
    cell.textContent = "";
    cell.classList.remove("x", "o");
  });
}

function checkWinner() {
  const wins = [
    [0, 1, 2],
    [3, 4, 5],
    [6, 7, 8],
    [0, 3, 6],
    [1, 4, 7],
    [2, 5, 8],
    [0, 4, 8],
    [2, 4, 6]
  ];
  return wins.find(([a, b, c]) => board[a] && board[a] === board[b] && board[a] === board[c]);
}

function checkWinnerFor(mark) {
  const wins = [
    [0, 1, 2],
    [3, 4, 5],
    [6, 7, 8],
    [0, 3, 6],
    [1, 4, 7],
    [2, 5, 8],
    [0, 4, 8],
    [2, 4, 6]
  ];
  return wins.find(([a, b, c]) => board[a] === mark && board[b] === mark && board[c] === mark);
}

function applyMove(index, mark) {
  board[index] = mark;
  cells[index].textContent = mark;
  cells[index].classList.add(mark.toLowerCase());
}

function finishRound(message, canResume) {
  showMenu(message, canResume);
}

function handleMove(index) {
  if (paused || board[index]) return;
  if (current !== playerMark) return;
  applyMove(index, current);

  const winnerLine = checkWinner();
  if (winnerLine) {
    if (current === "X") {
      xWins++;
      if (xWins > highscore) {
        highscore = xWins;
        stats.TicTacToe = highscore;
        Storage.set("stats", stats);
        highscoreEl.textContent = "High Score: " + highscore;
      }
    } else {
      oWins++;
    }
    scoreEl.textContent = `Score: X ${xWins} - O ${oWins}`;
    finishRound(`${current} Wins`, false);
    return;
  }

  if (board.every(cell => cell)) {
    finishRound("Draw", false);
    return;
  }

  current = current === "X" ? "O" : "X";
  turnEl.textContent = "Turn: " + current;

  if (current === botMark) {
    setTimeout(botMove, 200);
  }
}

function botMove() {
  if (paused || current !== botMark) return;
  const empty = board
    .map((value, idx) => (value ? null : idx))
    .filter(idx => idx !== null);
  if (empty.length === 0) return;

  let move = findBestMove(botMark) ?? findBestMove(playerMark);
  if (move === null) {
    if (board[4] === "") {
      move = 4;
    } else {
      const corners = [0, 2, 6, 8].filter(i => board[i] === "");
      move = corners.length ? corners[Math.floor(Math.random() * corners.length)] : empty[Math.floor(Math.random() * empty.length)];
    }
  }

  applyMove(move, botMark);

  const winnerLine = checkWinner();
  if (winnerLine) {
    oWins++;
    scoreEl.textContent = `Score: X ${xWins} - O ${oWins}`;
    finishRound("O Wins", false);
    return;
  }

  if (board.every(cell => cell)) {
    finishRound("Draw", false);
    return;
  }

  current = playerMark;
  turnEl.textContent = "Turn: " + current;
}

function findBestMove(mark) {
  for (let i = 0; i < board.length; i++) {
    if (board[i]) continue;
    board[i] = mark;
    const win = checkWinnerFor(mark);
    board[i] = "";
    if (win) return i;
  }
  return null;
}

cells.forEach(cell => {
  cell.addEventListener("click", () => handleMove(Number(cell.dataset.cell)));
});

document.addEventListener("keydown", e => {
  if (e.key === "Escape") {
    showMenu();
  }
});

init();
