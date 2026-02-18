const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d");

const GRID = 21;
const SIZE = canvas.width / GRID;

let snake, dir, food, score, speed, loop;
let paused = false;
let touchStartX = 0;
let touchStartY = 0;
const SWIPE_MIN_DISTANCE = 24;

const overlay = document.getElementById("overlay");
const overlayTitle = document.getElementById("overlayTitle");
const resumeBtn = document.getElementById("resumeBtn");
const scoreEl = document.getElementById("score");
const highscoreEl = document.getElementById("highscore");

const stats = Storage.get("stats", {});
let highscore = stats.Snake || 0;
highscoreEl.textContent = "High Score: " + highscore;

document.getElementById("restartBtn").onclick = restart;
document.getElementById("backBtn").onclick = () =>
    location.href = "../../index.html";
resumeBtn.onclick = resume;

function setDirection(next) {
    if (!next) return;
    if (next.x === -dir.x && next.y === -dir.y) return;
    dir = next;
}

function handleAction(action) {
    if (action === "pause") {
        paused = !paused;
        return;
    }
    if (!overlay.classList.contains("hidden")) return;
    const map = {
        up: { x: 0, y: -1 },
        down: { x: 0, y: 1 },
        left: { x: -1, y: 0 },
        right: { x: 1, y: 0 }
    };
    setDirection(map[action]);
}

function handleSwipe(dx, dy) {
    if (Math.abs(dx) < SWIPE_MIN_DISTANCE && Math.abs(dy) < SWIPE_MIN_DISTANCE) return;
    if (Math.abs(dx) > Math.abs(dy)) {
        handleAction(dx > 0 ? "right" : "left");
        return;
    }
    handleAction(dy > 0 ? "down" : "up");
}

function showMenu(title = "Menu", canResume = true) {
    paused = true;
    overlayTitle.textContent = title;
    resumeBtn.classList.toggle("hidden", !canResume);
    overlay.classList.remove("hidden");
}

function init() {
    snake = [{ x: 10, y: 10 }];
    dir = { x: 1, y: 0 };
    food = spawnFood();
    score = 0;
    speed = 140;
    paused = false;

    scoreEl.textContent = "Score: 0";
    overlay.classList.add("hidden");

    clearInterval(loop);
    loop = setInterval(tick, speed);
}

function spawnFood() {
    let f;
    do {
        f = {
            x: Math.floor(Math.random() * GRID),
            y: Math.floor(Math.random() * GRID)
        };
    } while (snake.some(s => s.x === f.x && s.y === f.y));
    return f;
}

document.addEventListener("keydown", e => {
    if (e.key === "Escape") {
        showMenu();
        return;
    }
    if (!overlay.classList.contains("hidden")) return;

    const map = {
        ArrowUp: { x: 0, y: -1 },
        ArrowDown: { x: 0, y: 1 },
        ArrowLeft: { x: -1, y: 0 },
        ArrowRight: { x: 1, y: 0 }
    };

    if (map[e.key]) setDirection(map[e.key]);

    if (e.key === " ") paused = !paused;
});

document.querySelectorAll(".touch-btn").forEach(btn => {
    btn.addEventListener("click", () => handleAction(btn.dataset.action));
});

canvas.addEventListener("touchstart", (e) => {
    if (!e.touches.length) return;
    touchStartX = e.touches[0].clientX;
    touchStartY = e.touches[0].clientY;
    e.preventDefault();
}, { passive: false });

canvas.addEventListener("touchend", (e) => {
    if (!e.changedTouches.length) return;
    const endX = e.changedTouches[0].clientX;
    const endY = e.changedTouches[0].clientY;
    handleSwipe(endX - touchStartX, endY - touchStartY);
    e.preventDefault();
}, { passive: false });

function tick() {
    if (paused) return;

    const head = {
        x: snake[0].x + dir.x,
        y: snake[0].y + dir.y
    };

    if (
        head.x < 0 || head.y < 0 ||
        head.x >= GRID || head.y >= GRID ||
        snake.some(s => s.x === head.x && s.y === head.y)
    ) {
        return gameOver();
    }

    snake.unshift(head);

    if (head.x === food.x && head.y === food.y) {
        score++;
        speed = Math.max(60, speed - 5);
        food = spawnFood();
        clearInterval(loop);
        loop = setInterval(tick, speed);
    } else {
        snake.pop();
    }

    scoreEl.textContent = "Score: " + score;
    draw();
}

function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    ctx.fillStyle = "#00ff88";
    snake.forEach(s =>
        ctx.fillRect(s.x * SIZE + 2, s.y * SIZE + 2, SIZE - 4, SIZE - 4)
    );

    ctx.fillStyle = "#ff4455";
    ctx.beginPath();
    ctx.arc(
        food.x * SIZE + SIZE / 2,
        food.y * SIZE + SIZE / 2,
        SIZE / 2.5,
        0,
        Math.PI * 2
    );
    ctx.fill();
}

function gameOver() {
    clearInterval(loop);

    if (score > highscore) {
        highscore = score;
        stats.Snake = score;
        Storage.set("stats", stats);
        highscoreEl.textContent = "High Score: " + highscore;
    }

    showMenu("Game Over", false);
}

function restart() {
    init();
}

function resume() {
    if (overlay.classList.contains("hidden")) return;
    paused = false;
    overlay.classList.add("hidden");
}

init();
