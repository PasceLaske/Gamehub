const boardEl = document.getElementById("board");
const turnEl = document.getElementById("turn");
const scoreEl = document.getElementById("score");
const highscoreEl = document.getElementById("highscore");
const overlay = document.getElementById("overlay");
const overlayTitle = document.getElementById("overlayTitle");
const resumeBtn = document.getElementById("resumeBtn");

const stats = Storage.get("stats", {});
let highscore = stats.Chess || 0;
highscoreEl.textContent = "High Score: " + highscore;

const PIECES = {
  p: "p",
  r: "r",
  n: "n",
  b: "b",
  q: "q",
  k: "k"
};

const PIECE_VALUES = {
  p: 1,
  n: 3,
  b: 3,
  r: 5,
  q: 9,
  k: 100
};

const PIECE_SYMBOLS = {
  white: { k: "♔", q: "♕", r: "♖", b: "♗", n: "♘", p: "♙" },
  black: { k: "♚", q: "♛", r: "♜", b: "♝", n: "♞", p: "♟" }
};

let board;
let current = "white";
let selected = null;
let possibleMoves = [];
let paused = false;
let whiteCaptures = 0;
let blackCaptures = 0;
const playerColor = "white";
const botColor = "black";

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
    setTimeout(botMove, 250);
  }
}

function initBoard() {
  board = [
    [
      { type: "r", color: "black" },
      { type: "n", color: "black" },
      { type: "b", color: "black" },
      { type: "q", color: "black" },
      { type: "k", color: "black" },
      { type: "b", color: "black" },
      { type: "n", color: "black" },
      { type: "r", color: "black" }
    ],
    Array.from({ length: 8 }, () => ({ type: "p", color: "black" })),
    Array.from({ length: 8 }, () => null),
    Array.from({ length: 8 }, () => null),
    Array.from({ length: 8 }, () => null),
    Array.from({ length: 8 }, () => null),
    Array.from({ length: 8 }, () => ({ type: "p", color: "white" })),
    [
      { type: "r", color: "white" },
      { type: "n", color: "white" },
      { type: "b", color: "white" },
      { type: "q", color: "white" },
      { type: "k", color: "white" },
      { type: "b", color: "white" },
      { type: "n", color: "white" },
      { type: "r", color: "white" }
    ]
  ];
}

function render() {
  boardEl.innerHTML = "";
  for (let row = 0; row < 8; row++) {
    for (let col = 0; col < 8; col++) {
      const cell = document.createElement("div");
      cell.className = `cell ${(row + col) % 2 === 0 ? "light" : "dark"}`;
      cell.dataset.row = row;
      cell.dataset.col = col;

      const piece = board[row][col];
      if (piece) {
        const span = document.createElement("span");
        span.className = `piece ${piece.color}`;
        span.textContent = PIECE_SYMBOLS[piece.color][piece.type];
        cell.appendChild(span);
      }

      if (selected && selected.row === row && selected.col === col) {
        cell.classList.add("selected");
      }
      if (possibleMoves.some(m => m.row === row && m.col === col)) {
        cell.classList.add("move");
      }

      boardEl.appendChild(cell);
    }
  }

  turnEl.textContent = `Turn: ${current === "white" ? "White" : "Black"}`;
  scoreEl.textContent = `Captured: White ${whiteCaptures} - Black ${blackCaptures}`;
}

function inBounds(row, col) {
  return row >= 0 && row < 8 && col >= 0 && col < 8;
}

function isEnemy(row, col, color) {
  return board[row][col] && board[row][col].color !== color;
}

function isEmpty(row, col) {
  return !board[row][col];
}

function rayMoves(row, col, color, directions) {
  const moves = [];
  directions.forEach(dir => {
    let r = row + dir.r;
    let c = col + dir.c;
    while (inBounds(r, c)) {
      if (isEmpty(r, c)) {
        moves.push({ row: r, col: c });
      } else {
        if (isEnemy(r, c, color)) moves.push({ row: r, col: c });
        break;
      }
      r += dir.r;
      c += dir.c;
    }
  });
  return moves;
}

function getMoves(row, col) {
  const piece = board[row][col];
  if (!piece) return [];
  const moves = [];
  const color = piece.color;
  const dir = color === "white" ? -1 : 1;

  switch (piece.type) {
    case PIECES.p: {
      const forward = row + dir;
      if (inBounds(forward, col) && isEmpty(forward, col)) {
        moves.push({ row: forward, col });
        const startRow = color === "white" ? 6 : 1;
        const twoForward = row + dir * 2;
        if (row === startRow && isEmpty(twoForward, col)) {
          moves.push({ row: twoForward, col });
        }
      }
      [-1, 1].forEach(dc => {
        const r = row + dir;
        const c = col + dc;
        if (inBounds(r, c) && isEnemy(r, c, color)) {
          moves.push({ row: r, col: c });
        }
      });
      break;
    }
    case PIECES.r:
      return rayMoves(row, col, color, [
        { r: 1, c: 0 },
        { r: -1, c: 0 },
        { r: 0, c: 1 },
        { r: 0, c: -1 }
      ]);
    case PIECES.b:
      return rayMoves(row, col, color, [
        { r: 1, c: 1 },
        { r: 1, c: -1 },
        { r: -1, c: 1 },
        { r: -1, c: -1 }
      ]);
    case PIECES.q:
      return rayMoves(row, col, color, [
        { r: 1, c: 0 },
        { r: -1, c: 0 },
        { r: 0, c: 1 },
        { r: 0, c: -1 },
        { r: 1, c: 1 },
        { r: 1, c: -1 },
        { r: -1, c: 1 },
        { r: -1, c: -1 }
      ]);
    case PIECES.n: {
      const jumps = [
        { r: -2, c: -1 },
        { r: -2, c: 1 },
        { r: -1, c: -2 },
        { r: -1, c: 2 },
        { r: 1, c: -2 },
        { r: 1, c: 2 },
        { r: 2, c: -1 },
        { r: 2, c: 1 }
      ];
      jumps.forEach(jump => {
        const r = row + jump.r;
        const c = col + jump.c;
        if (!inBounds(r, c)) return;
        if (isEmpty(r, c) || isEnemy(r, c, color)) {
          moves.push({ row: r, col: c });
        }
      });
      break;
    }
    case PIECES.k: {
      const steps = [
        { r: -1, c: -1 },
        { r: -1, c: 0 },
        { r: -1, c: 1 },
        { r: 0, c: -1 },
        { r: 0, c: 1 },
        { r: 1, c: -1 },
        { r: 1, c: 0 },
        { r: 1, c: 1 }
      ];
      steps.forEach(step => {
        const r = row + step.r;
        const c = col + step.c;
        if (!inBounds(r, c)) return;
        if (isEmpty(r, c) || isEnemy(r, c, color)) {
          moves.push({ row: r, col: c });
        }
      });
      break;
    }
    default:
      break;
  }

  return moves;
}

function clearSelection() {
  selected = null;
  possibleMoves = [];
}

function promoteIfNeeded(piece, row) {
  if (piece.type !== PIECES.p) return;
  if (piece.color === "white" && row === 0) piece.type = PIECES.q;
  if (piece.color === "black" && row === 7) piece.type = PIECES.q;
}

function applyMove(fromRow, fromCol, toRow, toCol) {
  const moving = board[fromRow][fromCol];
  const target = board[toRow][toCol];

  if (target) {
    if (target.color === "white") blackCaptures++;
    if (target.color === "black") whiteCaptures++;
    if (target.type === PIECES.k) {
      board[toRow][toCol] = moving;
      board[fromRow][fromCol] = null;
      promoteIfNeeded(moving, toRow);
      clearSelection();
      render();
      showMenu(`${moving.color === "white" ? "White" : "Black"} Wins`, false);
      return true;
    }
  }

  board[toRow][toCol] = moving;
  board[fromRow][fromCol] = null;
  promoteIfNeeded(moving, toRow);

  if (whiteCaptures > highscore) {
    highscore = whiteCaptures;
    stats.Chess = highscore;
    Storage.set("stats", stats);
    highscoreEl.textContent = "High Score: " + highscore;
  }

  clearSelection();
  current = current === "white" ? "black" : "white";
  render();
  return false;
}

function getAllMoves(color) {
  const moves = [];
  for (let row = 0; row < 8; row++) {
    for (let col = 0; col < 8; col++) {
      const piece = board[row][col];
      if (!piece || piece.color !== color) continue;
      const pieceMoves = getMoves(row, col);
      pieceMoves.forEach(move => {
        moves.push({ from: { row, col }, to: move });
      });
    }
  }
  return moves;
}

function evaluateMove(fromRow, fromCol, toRow, toCol) {
  const moving = board[fromRow][fromCol];
  const captured = board[toRow][toCol];
  const captureValue = captured ? PIECE_VALUES[captured.type] * 10 : 0;
  const centerDistance = Math.abs(3.5 - toRow) + Math.abs(3.5 - toCol);
  const centerBonus = Math.max(0, 4 - centerDistance);

  board[toRow][toCol] = moving;
  board[fromRow][fromCol] = null;

  const opponent = moving.color === "white" ? "black" : "white";
  const threatened = isSquareThreatened(toRow, toCol, opponent);
  const riskPenalty = threatened ? PIECE_VALUES[moving.type] * 4 : 0;

  board[fromRow][fromCol] = moving;
  board[toRow][toCol] = captured;

  return captureValue + centerBonus - riskPenalty;
}

function isSquareThreatened(row, col, byColor) {
  for (let r = 0; r < 8; r++) {
    for (let c = 0; c < 8; c++) {
      const piece = board[r][c];
      if (!piece || piece.color !== byColor) continue;
      const moves = getMoves(r, c);
      if (moves.some(m => m.row === row && m.col === col)) return true;
    }
  }
  return false;
}

function botMove() {
  if (paused || current !== botColor) return;
  const moves = getAllMoves(botColor);
  if (moves.length === 0) {
    showMenu("Draw", false);
    return;
  }
  let bestScore = -Infinity;
  let bestMoves = [];
  moves.forEach(move => {
    const target = board[move.to.row][move.to.col];
    if (target && target.type === PIECES.k) {
      bestMoves = [move];
      bestScore = Infinity;
      return;
    }
    const score = evaluateMove(move.from.row, move.from.col, move.to.row, move.to.col);
    if (score > bestScore) {
      bestScore = score;
      bestMoves = [move];
    } else if (score === bestScore) {
      bestMoves.push(move);
    }
  });
  const choice = bestMoves[Math.floor(Math.random() * bestMoves.length)];
  applyMove(choice.from.row, choice.from.col, choice.to.row, choice.to.col);
}

function handleMove(row, col) {
  if (paused) return;
  const piece = board[row][col];

  if (selected && possibleMoves.some(m => m.row === row && m.col === col)) {
    const finished = applyMove(selected.row, selected.col, row, col);
    if (!finished && current === botColor) {
      setTimeout(botMove, 250);
    }
    return;
  }

  if (piece && piece.color === current && current === playerColor) {
    selected = { row, col };
    possibleMoves = getMoves(row, col);
  } else {
    clearSelection();
  }
  render();
}

boardEl.addEventListener("click", e => {
  const cell = e.target.closest(".cell");
  if (!cell) return;
  if (!overlay.classList.contains("hidden")) return;
  handleMove(Number(cell.dataset.row), Number(cell.dataset.col));
});

document.addEventListener("keydown", e => {
  if (e.key === "Escape") {
    showMenu();
  }
});

function restart() {
  paused = false;
  overlay.classList.add("hidden");
  whiteCaptures = 0;
  blackCaptures = 0;
  current = "white";
  clearSelection();
  initBoard();
  render();
  if (current === botColor) {
    setTimeout(botMove, 250);
  }
}

initBoard();
render();
