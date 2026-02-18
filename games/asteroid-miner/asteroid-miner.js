const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d");

const oreEl = document.getElementById("ore");
const hullEl = document.getElementById("hull");
const highscoreEl = document.getElementById("highscore");
const overlay = document.getElementById("overlay");
const overlayTitle = document.getElementById("overlayTitle");
const startBtn = document.getElementById("startBtn");
const resumeBtn = document.getElementById("resumeBtn");
const restartBtn = document.getElementById("restartBtn");
const backBtn = document.getElementById("backBtn");

const stats = Storage.get("stats", {});
let highscore = stats.AsteroidMiner || 0;
highscoreEl.textContent = "Best Ore: " + highscore;

const player = {
  x: canvas.width / 2,
  y: canvas.height - 38,
  w: 30,
  h: 18,
  speed: 5.2
};

let ore = 0;
let hull = 3;
let running = false;
let paused = false;
let asteroids = [];
let bullets = [];
let keys = {};
let spawnTimer = 0;
let fireCooldown = 0;
let frame = 0;
let rafId = null;
let touchDirection = 0;

function showOverlay(title, canResume) {
  overlayTitle.textContent = title;
  resumeBtn.classList.toggle("hidden", !canResume);
  startBtn.classList.toggle("hidden", running);
  overlay.classList.remove("hidden");
}

function hideOverlay() {
  overlay.classList.add("hidden");
}

function resetGame() {
  ore = 0;
  hull = 3;
  asteroids = [];
  bullets = [];
  player.x = canvas.width / 2;
  running = true;
  paused = false;
  spawnTimer = 0;
  fireCooldown = 0;
  frame = 0;
  touchDirection = 0;
  updateHud();
  hideOverlay();
}

function updateHud() {
  oreEl.textContent = "Ore: " + ore;
  hullEl.textContent = "Hull: " + hull;
}

function spawnAsteroid() {
  const radius = 10 + Math.random() * 18;
  const hp = Math.max(1, Math.floor(radius / 9));
  const speed = 1.2 + Math.random() * 1.4 + Math.min(1.6, frame / 3600);
  asteroids.push({
    x: radius + Math.random() * (canvas.width - radius * 2),
    y: -radius - 6,
    r: radius,
    hp,
    speed
  });
}

function fireBullet() {
  bullets.push({
    x: player.x,
    y: player.y - player.h / 2,
    vy: -7.6
  });
}

function saveHighscoreIfNeeded() {
  if (ore <= highscore) return;
  highscore = ore;
  stats.AsteroidMiner = highscore;
  Storage.set("stats", stats);
  highscoreEl.textContent = "Best Ore: " + highscore;
}

function endGame() {
  running = false;
  paused = false;
  saveHighscoreIfNeeded();
  showOverlay("Game Over - Ore " + ore, false);
}

function clampPlayer() {
  const half = player.w / 2;
  if (player.x < half) player.x = half;
  if (player.x > canvas.width - half) player.x = canvas.width - half;
}

function updatePlayer() {
  if (keys.ArrowLeft || keys.KeyA) player.x -= player.speed;
  if (keys.ArrowRight || keys.KeyD) player.x += player.speed;
  if (touchDirection !== 0) player.x += touchDirection * player.speed;
  clampPlayer();
}

function updateAsteroids() {
  for (let i = asteroids.length - 1; i >= 0; i--) {
    const asteroid = asteroids[i];
    asteroid.y += asteroid.speed;

    const collideX = Math.abs(asteroid.x - player.x) < asteroid.r + player.w / 2 - 2;
    const collideY = asteroid.y + asteroid.r > player.y - player.h / 2;
    if (collideX && collideY) {
      asteroids.splice(i, 1);
      hull -= 1;
      updateHud();
      if (hull <= 0) {
        endGame();
        return;
      }
      continue;
    }

    if (asteroid.y - asteroid.r > canvas.height) {
      asteroids.splice(i, 1);
    }
  }
}

function updateBullets() {
  for (let i = bullets.length - 1; i >= 0; i--) {
    const bullet = bullets[i];
    bullet.y += bullet.vy;
    if (bullet.y < -8) bullets.splice(i, 1);
  }
}

function resolveHits() {
  for (let i = bullets.length - 1; i >= 0; i--) {
    const bullet = bullets[i];
    let hit = false;

    for (let j = asteroids.length - 1; j >= 0; j--) {
      const asteroid = asteroids[j];
      const dx = bullet.x - asteroid.x;
      const dy = bullet.y - asteroid.y;
      if (dx * dx + dy * dy > asteroid.r * asteroid.r) continue;

      asteroid.hp -= 1;
      hit = true;
      if (asteroid.hp <= 0) {
        ore += Math.max(1, Math.round(asteroid.r / 6));
        asteroids.splice(j, 1);
        updateHud();
      }
      break;
    }

    if (hit) bullets.splice(i, 1);
  }
}

function drawBackground() {
  ctx.fillStyle = "#090d17";
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  for (let i = 0; i < 42; i++) {
    const x = (i * 97 + frame * 0.15) % canvas.width;
    const y = (i * 53 + frame * 0.35) % canvas.height;
    ctx.fillStyle = i % 3 === 0 ? "#4bb6ff" : "#ccd5ea";
    ctx.fillRect(x, y, 2, 2);
  }
}

function drawPlayer() {
  ctx.save();
  ctx.translate(player.x, player.y);

  ctx.fillStyle = "#4ee4a4";
  ctx.beginPath();
  ctx.moveTo(0, -player.h / 2);
  ctx.lineTo(player.w / 2, player.h / 2);
  ctx.lineTo(-player.w / 2, player.h / 2);
  ctx.closePath();
  ctx.fill();

  ctx.fillStyle = "#1b263b";
  ctx.fillRect(-4, -4, 8, 8);
  ctx.restore();
}

function drawAsteroids() {
  asteroids.forEach((asteroid) => {
    ctx.beginPath();
    ctx.fillStyle = asteroid.hp > 2 ? "#b38b62" : "#9b6f46";
    ctx.arc(asteroid.x, asteroid.y, asteroid.r, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = "#f7d36b";
    ctx.beginPath();
    ctx.arc(asteroid.x - asteroid.r * 0.25, asteroid.y - asteroid.r * 0.18, asteroid.r * 0.18, 0, Math.PI * 2);
    ctx.fill();
  });
}

function drawBullets() {
  ctx.fillStyle = "#6af3ff";
  bullets.forEach((bullet) => {
    ctx.fillRect(bullet.x - 2, bullet.y - 8, 4, 10);
  });
}

function draw() {
  drawBackground();
  drawPlayer();
  drawAsteroids();
  drawBullets();
}

function loop() {
  frame += 1;

  if (running && !paused) {
    updatePlayer();

    spawnTimer -= 1;
    if (spawnTimer <= 0) {
      spawnAsteroid();
      spawnTimer = Math.max(18, 54 - Math.floor(frame / 180));
    }

    fireCooldown -= 1;
    if ((keys.Space || keys.KeyW) && fireCooldown <= 0) {
      fireBullet();
      fireCooldown = 9;
    }

    updateBullets();
    resolveHits();
    updateAsteroids();
  }

  draw();
  rafId = requestAnimationFrame(loop);
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

document.addEventListener("keydown", (e) => {
  if (e.key === "Escape") {
    if (running && !paused) pauseGame();
    return;
  }
  keys[e.code] = true;
});

document.addEventListener("keyup", (e) => {
  keys[e.code] = false;
});

document.querySelectorAll(".touch-btn").forEach((btn) => {
  btn.addEventListener("pointerdown", (e) => {
    e.preventDefault();
    const action = btn.dataset.action;
    if (action === "left") touchDirection = -1;
    if (action === "right") touchDirection = 1;
    if (action === "fire" && running && !paused) fireBullet();
    if (action === "pause") {
      if (running && !paused) pauseGame();
      else if (running && paused) resumeGame();
    }
  });

  btn.addEventListener("pointerup", () => {
    const action = btn.dataset.action;
    if (action === "left" || action === "right") touchDirection = 0;
  });

  btn.addEventListener("pointerleave", () => {
    const action = btn.dataset.action;
    if (action === "left" || action === "right") touchDirection = 0;
  });
});

startBtn.addEventListener("click", resetGame);
resumeBtn.addEventListener("click", resumeGame);
restartBtn.addEventListener("click", resetGame);
backBtn.addEventListener("click", () => {
  if (rafId) cancelAnimationFrame(rafId);
  location.href = "../../index.html";
});

updateHud();
showOverlay("Mine asteroids and survive", false);
loop();
