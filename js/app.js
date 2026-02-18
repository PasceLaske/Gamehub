const games = [
    { title: "Snake", path: "games/snake/index.html", playable: true },
    { title: "Tetris", path: "games/tetris/index.html", playable: true },
    { title: "Pong", path: "games/pong/index.html", playable: true },
    { title: "Chess", path: "games/chess/index.html", playable: true },
    { title: "Wordle", path: "games/wordle/index.html", playable: false },
    { title: "Connect 4", path: "games/connect4/index.html", playable: false},
    { title: "Tic Tac Toe", path: "games/tictactoe/index.html", playable: true },
    { title: "Reaction Rush", path: "games/reaction/index.html", playable: false },
    { title: "Memory Match", path: "games/memory/index.html", playable: true },
    { title: "Asteroid Miner", path: "games/asteroid-miner/index.html", playable: false },
    { title: "Castle Defender", path: "games/castle-defender/index.html", playable: false },
    { title: "Neon Racer", path: "games/neon-racer/index.html", playable: false },
    { title: "Dungeon Escape", path: "games/dungeon-escape/index.html", playable: false },
    { title: "Pixel Farm", path: "games/pixel-farm/index.html", playable: false },
    { title: "Space Trader", path: "games/space-trader/index.html", playable: false },
    { title: "Island Builder", path: "games/island-builder/index.html", playable: false },
    { title: "Sky Arena", path: "games/sky-arena/index.html", playable: false },
    { title: "Robot Arena", path: "games/robot-arena/index.html", playable: false },
    { title: "Frost Quest", path: "games/frost-quest/index.html", playable: false }
];

function renderGames() {
    const container = document.getElementById("games");
    if (!container) return;

    container.innerHTML = "";

    const orderedGames = [...games].sort((a, b) => {
        if (a.playable === b.playable) return 0;
        return a.playable ? -1 : 1;
    });

    orderedGames.forEach((game) => {
        const card = document.createElement(game.playable ? "a" : "div");
        card.className = "game-card";
        card.textContent = game.title;

        if (game.playable) {
            card.href = game.path;
        } else {
            card.classList.add("is-locked");
            card.setAttribute("aria-disabled", "true");

            const overlay = document.createElement("span");
            overlay.className = "game-card__overlay";
            overlay.textContent = "Still in work";
            card.appendChild(overlay);
        }

        container.appendChild(card);
    });
}

renderGames();
renderStats();
