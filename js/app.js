const games = [
    { title: "Snake", path: "games/snake/index.html", playable: true },
    { title: "Tetris", path: "games/tetris/index.html", playable: true },
    { title: "Pong", path: "games/pong/index.html", playable: true },
    { title: "Chess", path: "games/chess/index.html", playable: true },
    { title: "Connect 4", path: "games/connect4/index.html", playable: false},
    { title: "Tic Tac Toe", path: "games/tictactoe/index.html", playable: false },
    { title: "Reaction Rush", path: "games/reaction/index.html", playable: false },
    { title: "Memory Match", path: "games/memory/index.html", playable: true }
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
