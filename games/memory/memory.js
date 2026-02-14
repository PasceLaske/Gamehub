const boardEl = document.getElementById("board");
const movesEl = document.getElementById("moves");
const pairsEl = document.getElementById("pairs");
const highscoreEl = document.getElementById("highscore");
const overlay = document.getElementById("overlay");
const overlayTitle = document.getElementById("overlayTitle");
const resumeBtn = document.getElementById("resumeBtn");
const startBtn = document.getElementById("startBtn");
const restartBtn = document.getElementById("restartBtn");
const backBtn = document.getElementById("backBtn");

const symbols = [
  "\u{1F680}",
  "\u{1F3AE}",
  "\u{1F40D}",
  "\u{1F9E9}",
  "\u{26BD}",
  "\u{1F47E}",
  "\u{1F525}",
  "\u{1F3AF}"
];
const stats = Storage.get("stats", {});
const storedBestMoves = Number(stats.MemoryMatchBestMoves);
let bestMoves = Number.isFinite(storedBestMoves) && storedBestMoves > 0
  ? storedBestMoves
  : 0;

let firstPick = null;
let secondPick = null;
let locked = false;
let running = false;
let paused = false;
let moves = 0;
let pairs = 0;

highscoreEl.textContent = bestMoves > 0 ? "Best Moves: " + bestMoves : "Best Moves: -";

function shuffle(arr) {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

function updateHud() {
  movesEl.textContent = "Moves: " + moves;
  pairsEl.textContent = "Pairs: " + pairs + "/8";
}

function showOverlay(title, canResume) {
  overlayTitle.textContent = title;
  resumeBtn.classList.toggle("hidden", !canResume);
  overlay.classList.remove("hidden");
}

function hideOverlay() {
  overlay.classList.add("hidden");
}

function revealCard(card) {
  card.classList.add("revealed");
  card.textContent = card.dataset.value;
}

function hideCard(card) {
  card.classList.remove("revealed");
  card.textContent = "?";
}

function markMatched(a, b) {
  a.classList.remove("revealed");
  b.classList.remove("revealed");
  a.classList.add("matched");
  b.classList.add("matched");
}

function buildBoard() {
  boardEl.innerHTML = "";
  const values = shuffle([...symbols, ...symbols]);

  values.forEach((value, index) => {
    const card = document.createElement("button");
    card.className = "card";
    card.textContent = "?";
    card.dataset.index = String(index);
    card.dataset.value = value;
    card.addEventListener("click", onCardClick);
    boardEl.appendChild(card);
  });
}

function finishGame() {
  running = false;
  paused = false;
  if (bestMoves === 0 || moves < bestMoves) {
    bestMoves = moves;
    stats.MemoryMatchBestMoves = bestMoves;
    Storage.set("stats", stats);
  }
  highscoreEl.textContent = "Best Moves: " + bestMoves;

  showOverlay("Completed in " + moves + " moves", false);
}

function onCardClick(event) {
  if (!running || paused || locked) return;

  const card = event.currentTarget;
  if (card.classList.contains("revealed") || card.classList.contains("matched")) return;

  revealCard(card);

  if (!firstPick) {
    firstPick = card;
    return;
  }

  secondPick = card;
  moves += 1;
  updateHud();

  if (firstPick.dataset.value === secondPick.dataset.value) {
    markMatched(firstPick, secondPick);
    pairs += 1;
    firstPick = null;
    secondPick = null;
    updateHud();

    if (pairs === 8) {
      finishGame();
    }
    return;
  }

  locked = true;
  setTimeout(() => {
    hideCard(firstPick);
    hideCard(secondPick);
    firstPick = null;
    secondPick = null;
    locked = false;
  }, 650);
}

function startGame() {
  firstPick = null;
  secondPick = null;
  locked = false;
  running = true;
  paused = false;
  moves = 0;
  pairs = 0;
  updateHud();
  buildBoard();
  hideOverlay();
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

startBtn.addEventListener("click", startGame);
restartBtn.addEventListener("click", startGame);
resumeBtn.addEventListener("click", resumeGame);
backBtn.addEventListener("click", () => {
  location.href = "../../index.html";
});

document.addEventListener("keydown", e => {
  if (e.key === "Escape") {
    pauseGame();
  }
});

updateHud();
buildBoard();
showOverlay("Find all pairs", false);
