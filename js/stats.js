function recordGame(game, score) {
    const stats = Storage.get("stats", {});
    stats[game] = Math.max(score, stats[game] || 0);
    Storage.set("stats", stats);
}

function renderStats() {
    const stats = Storage.get("stats", {});
    const el = document.getElementById("stats");
    if (!el) return;
    el.innerHTML = Object.entries(stats)
        .map(([g, s]) => `${g}: ${s}`)
        .join("<br>");
}
