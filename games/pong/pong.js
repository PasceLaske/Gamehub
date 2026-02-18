const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d");

const PADDLE_W = 10;
const PADDLE_H = 70;
const BALL_SIZE = 10;

const DIFFICULTIES = {
  easy: {
    aiSpeed: 2.6,
    playerSpeed: 7,
    ballSpeed: 3.6,
    maxScore: 3,
    aiError: 26,
    reactionDelay: 200
  },
  normal: {
    aiSpeed: 3.6,
    playerSpeed: 6.2,
    ballSpeed: 4.4,
    maxScore: 5,
    aiError: 14,
    reactionDelay: 120
  },
  hard: {
    aiSpeed: 4.8,
    playerSpeed: 5.8,
    ballSpeed: 5.2,
    maxScore: 7,
    aiError: 6,
    reactionDelay: 60
  }
};
let maxScore = DIFFICULTIES.normal.maxScore;
let baseBallSpeed = DIFFICULTIES.normal.ballSpeed;
let difficulty = "normal";
let aiError = DIFFICULTIES.normal.aiError;
let reactionDelay = DIFFICULTIES.normal.reactionDelay;
let lastAiUpdate = 0;
let aiTargetY = 0;

const scoreEl = document.getElementById("score");
const highscoreEl = document.getElementById("highscore");
const overlay = document.getElementById("overlay");
const overlayTitle = document.getElementById("overlayTitle");
const resumeBtn = document.getElementById("resumeBtn");
const difficultyButtons = document.querySelectorAll(".difficulty button");

const stats = Storage.get("stats", {});
let highscore = stats.Pong || 0;
highscoreEl.textContent = "High Score: " + highscore;

const player = {
  x: 20,
  y: canvas.height / 2 - PADDLE_H / 2,
  score: 0,
  speed: DIFFICULTIES.normal.playerSpeed
};

const ai = {
  x: canvas.width - 30,
  y: canvas.height / 2 - PADDLE_H / 2,
  score: 0,
  speed: DIFFICULTIES.normal.aiSpeed
};

let ball;
let loop;
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

function resetBall(direction = 1) {
  ball = {
    x: canvas.width / 2 - BALL_SIZE / 2,
    y: canvas.height / 2 - BALL_SIZE / 2,
    vx: baseBallSpeed * direction,
    vy: (Math.random() * 2 - 1) * (baseBallSpeed * 0.7)
  };
}

function updateScore() {
  scoreEl.textContent = `Score: ${player.score} - ${ai.score}`;
}

function updateHighscore() {
  if (player.score > highscore) {
    highscore = player.score;
    stats.Pong = highscore;
    Storage.set("stats", stats);
    highscoreEl.textContent = "High Score: " + highscore;
  }
}

function movePaddles() {
  if (keys.ArrowUp || keys.KeyW) player.y -= player.speed;
  if (keys.ArrowDown || keys.KeyS) player.y += player.speed;
  player.y = Math.max(0, Math.min(canvas.height - PADDLE_H, player.y));

  const now = Date.now();
  if (now - lastAiUpdate > reactionDelay) {
    lastAiUpdate = now;
    aiTargetY =
      ball.y + BALL_SIZE / 2 - PADDLE_H / 2 + (Math.random() * 2 - 1) * aiError;
  }

  if (ai.y < aiTargetY) ai.y += ai.speed;
  if (ai.y > aiTargetY) ai.y -= ai.speed;
  ai.y = Math.max(0, Math.min(canvas.height - PADDLE_H, ai.y));
}

function collidePaddle(paddle) {
  return (
    ball.x < paddle.x + PADDLE_W &&
    ball.x + BALL_SIZE > paddle.x &&
    ball.y < paddle.y + PADDLE_H &&
    ball.y + BALL_SIZE > paddle.y
  );
}

function applyPaddleBounce(paddle, direction) {
  const paddleCenter = paddle.y + PADDLE_H / 2;
  const ballCenter = ball.y + BALL_SIZE / 2;
  const offset = (ballCenter - paddleCenter) / (PADDLE_H / 2);
  const clamped = Math.max(-1, Math.min(1, offset));
  const angle = clamped * (Math.PI / 3);
  const speed = Math.min(
    Math.sqrt(ball.vx * ball.vx + ball.vy * ball.vy) + 0.25,
    8
  );

  ball.vx = Math.cos(angle) * speed * direction;
  ball.vy = Math.sin(angle) * speed;
}

function tick() {
  if (paused) return;
  movePaddles();

  ball.x += ball.vx;
  ball.y += ball.vy;

  if (ball.y <= 0 || ball.y + BALL_SIZE >= canvas.height) {
    ball.vy *= -1;
  }

  if (collidePaddle(player) && ball.vx < 0) {
    applyPaddleBounce(player, 1);
    ball.x = player.x + PADDLE_W;
  }

  if (collidePaddle(ai) && ball.vx > 0) {
    applyPaddleBounce(ai, -1);
    ball.x = ai.x - BALL_SIZE;
  }

  if (ball.x < 0) {
    ai.score++;
    updateScore();
    resetBall(1);
  }

  if (ball.x > canvas.width) {
    player.score++;
    updateScore();
    resetBall(-1);
  }

  if (player.score >= maxScore || ai.score >= maxScore) {
    updateHighscore();
    clearInterval(loop);
    showMenu("Game Over", false);
  }

  draw();
}

function draw() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = "#00ff88";
  ctx.fillRect(player.x, player.y, PADDLE_W, PADDLE_H);
  ctx.fillStyle = "#ff8c00";
  ctx.fillRect(ai.x, ai.y, PADDLE_W, PADDLE_H);
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(ball.x, ball.y, BALL_SIZE, BALL_SIZE);

  ctx.strokeStyle = "#333";
  ctx.setLineDash([6, 6]);
  ctx.beginPath();
  ctx.moveTo(canvas.width / 2, 0);
  ctx.lineTo(canvas.width / 2, canvas.height);
  ctx.stroke();
  ctx.setLineDash([]);
}

function restart() {
  player.score = 0;
  ai.score = 0;
  paused = false;
  updateScore();
  overlay.classList.add("hidden");
  resetBall(Math.random() > 0.5 ? 1 : -1);
  clearInterval(loop);
  loop = setInterval(tick, 16);
}

function resume() {
  if (overlay.classList.contains("hidden")) return;
  paused = false;
  overlay.classList.add("hidden");
}

function setDifficulty(key, shouldRestart = true) {
  const config = DIFFICULTIES[key] || DIFFICULTIES.normal;
  difficulty = key in DIFFICULTIES ? key : "normal";
  player.speed = config.playerSpeed;
  ai.speed = config.aiSpeed;
  baseBallSpeed = config.ballSpeed;
  maxScore = config.maxScore;
  aiError = config.aiError;
  reactionDelay = config.reactionDelay;

  difficultyButtons.forEach(btn => {
    btn.classList.toggle("active", btn.dataset.diff === difficulty);
  });

  if (shouldRestart) restart();
}

function setPlayerFromClientY(clientY) {
  if (!overlay.classList.contains("hidden")) return;
  const rect = canvas.getBoundingClientRect();
  const relativeY = clientY - rect.top;
  const logicalY = (relativeY / rect.height) * canvas.height;
  player.y = Math.max(0, Math.min(canvas.height - PADDLE_H, logicalY - PADDLE_H / 2));
}

difficultyButtons.forEach(btn => {
  btn.addEventListener("click", () => setDifficulty(btn.dataset.diff));
});

const keys = {};
document.addEventListener("keydown", e => {
  if (e.key === "Escape") {
    showMenu();
    return;
  }
  if (!overlay.classList.contains("hidden")) return;
  if (e.key.toLowerCase() === "p") paused = !paused;
  keys[e.code] = true;
});
document.addEventListener("keyup", e => {
  keys[e.code] = false;
});

canvas.addEventListener("pointerdown", e => {
  setPlayerFromClientY(e.clientY);
});

canvas.addEventListener("pointermove", e => {
  if (e.pointerType === "mouse" && (e.buttons & 1) === 0) return;
  setPlayerFromClientY(e.clientY);
});

canvas.addEventListener("touchstart", e => {
  if (!e.touches.length) return;
  setPlayerFromClientY(e.touches[0].clientY);
  e.preventDefault();
}, { passive: false });

canvas.addEventListener("touchmove", e => {
  if (!e.touches.length) return;
  setPlayerFromClientY(e.touches[0].clientY);
  e.preventDefault();
}, { passive: false });

updateScore();
setDifficulty("normal", false);
resetBall();
loop = setInterval(tick, 16);
