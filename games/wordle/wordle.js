const WORD_LENGTH = 5;
const MAX_GUESSES = 6;

const WORDS = [
    "APPLE", "BRAIN", "CLOUD", "DRIVE", "EARTH", "FLAME", "GIANT", "HOUSE",
    "INDEX", "JUICE", "KNIFE", "LIGHT", "MUSIC", "NURSE", "OCEAN", "PLANT",
    "QUEST", "RIVER", "SMILE", "TRAIN", "UNITY", "VIVID", "WATER", "YOUTH",
    "ZEBRA", "BRICK", "GRAPE", "SHEEP", "PIZZA", "SHINE", "STONE", "HEART"
];

const gridEl = document.getElementById("grid");
const messageEl = document.getElementById("message");
const keyboardEl = document.getElementById("keyboard");
const winsEl = document.getElementById("wins");
const lossesEl = document.getElementById("losses");

const KEY_ROWS = ["QWERTYUIOP", "ASDFGHJKL", "ENTERZXCVBNMBKSP"];
const KEY_PRIORITY = { absent: 1, present: 2, correct: 3 };

let answer = "";
let guesses = [];
let currentGuess = "";
let finished = false;
let isSubmitting = false;
let stats = Storage.get("stats", {});
let wordleStats = stats.Wordle || { wins: 0, losses: 0 };
const validWordCache = new Map();

function pickWord() {
    return WORDS[Math.floor(Math.random() * WORDS.length)];
}

function buildGrid() {
    gridEl.innerHTML = "";
    for (let i = 0; i < MAX_GUESSES * WORD_LENGTH; i++) {
        const cell = document.createElement("div");
        cell.className = "cell";
        gridEl.appendChild(cell);
    }
}

function buildKeyboard() {
    keyboardEl.innerHTML = "";
    KEY_ROWS.forEach((row) => {
        const rowEl = document.createElement("div");
        rowEl.className = "key-row";

        let i = 0;
        while (i < row.length) {
            if (row.startsWith("ENTER", i)) {
                rowEl.appendChild(createKey("ENTER", "Enter", true));
                i += 5;
                continue;
            }
            if (row.startsWith("BKSP", i)) {
                rowEl.appendChild(createKey("BKSP", "Back", true));
                i += 4;
                continue;
            }
            rowEl.appendChild(createKey(row[i], row[i], false));
            i += 1;
        }

        keyboardEl.appendChild(rowEl);
    });
}

function createKey(code, label, wide) {
    const btn = document.createElement("button");
    btn.className = "key" + (wide ? " wide" : "");
    btn.textContent = label;
    btn.dataset.key = code;
    btn.addEventListener("click", () => handleKey(code));
    return btn;
}

function startGame() {
    answer = pickWord();
    guesses = [];
    currentGuess = "";
    finished = false;
    messageEl.textContent = "Type a 5-letter word and press Enter.";
    buildGrid();
    buildKeyboard();
    render();
    renderStats();
}

function renderStats() {
    winsEl.textContent = "Wins: " + wordleStats.wins;
    lossesEl.textContent = "Losses: " + wordleStats.losses;
}

function render() {
    const cells = gridEl.querySelectorAll(".cell");
    const allGuesses = [...guesses, currentGuess];

    cells.forEach((cell, idx) => {
        const row = Math.floor(idx / WORD_LENGTH);
        const col = idx % WORD_LENGTH;
        const guess = allGuesses[row] || "";
        cell.textContent = guess[col] || "";
        cell.className = "cell";
    });

    const keyState = {};
    guesses.forEach((guess, row) => {
        const evals = evaluateGuess(guess, answer);
        for (let col = 0; col < WORD_LENGTH; col++) {
            const idx = row * WORD_LENGTH + col;
            const status = evals[col];
            cells[idx].classList.add(status);
            updateKeyState(keyState, guess[col], status);
        }
    });

    document.querySelectorAll(".key").forEach((key) => {
        const letter = key.dataset.key;
        key.classList.remove("correct", "present", "absent");
        if (keyState[letter]) key.classList.add(keyState[letter]);
    });
}

function updateKeyState(keyState, letter, status) {
    const prev = keyState[letter];
    if (!prev || KEY_PRIORITY[status] > KEY_PRIORITY[prev]) {
        keyState[letter] = status;
    }
}

function evaluateGuess(guess, target) {
    const out = Array(WORD_LENGTH).fill("absent");
    const counts = {};

    for (let i = 0; i < WORD_LENGTH; i++) {
        const ch = target[i];
        counts[ch] = (counts[ch] || 0) + 1;
    }

    for (let i = 0; i < WORD_LENGTH; i++) {
        if (guess[i] === target[i]) {
            out[i] = "correct";
            counts[guess[i]] -= 1;
        }
    }

    for (let i = 0; i < WORD_LENGTH; i++) {
        if (out[i] === "correct") continue;
        const ch = guess[i];
        if (counts[ch] > 0) {
            out[i] = "present";
            counts[ch] -= 1;
        }
    }

    return out;
}

function handleKey(key) {
    if (finished || isSubmitting) return;

    if (key === "ENTER") {
        submitGuess();
        return;
    }
    if (key === "BKSP") {
        currentGuess = currentGuess.slice(0, -1);
        render();
        return;
    }
    if (/^[A-Z]$/.test(key) && currentGuess.length < WORD_LENGTH) {
        currentGuess += key;
        render();
    }
}

async function submitGuess() {
    if (currentGuess.length !== WORD_LENGTH) {
        messageEl.textContent = "Word must be 5 letters.";
        return;
    }
    isSubmitting = true;
    messageEl.textContent = "Checking word...";

    const isValid = await isValidEnglishWord(currentGuess);
    if (!isValid) {
        messageEl.textContent = "Not a valid English word.";
        isSubmitting = false;
        return;
    }

    guesses.push(currentGuess);
    const won = currentGuess === answer;
    currentGuess = "";

    if (won) {
        finished = true;
        wordleStats.wins += 1;
        messageEl.textContent = "Correct! The word was " + answer + ".";
        saveStats();
    } else if (guesses.length >= MAX_GUESSES) {
        finished = true;
        wordleStats.losses += 1;
        messageEl.textContent = "No attempts left. Word: " + answer + ".";
        saveStats();
    } else {
        const left = MAX_GUESSES - guesses.length;
        messageEl.textContent = left + " attempts left.";
    }

    render();
    renderStats();
    isSubmitting = false;
}

function saveStats() {
    stats.Wordle = wordleStats;
    Storage.set("stats", stats);
}

document.addEventListener("keydown", (e) => {
    if (e.key === "Enter") {
        handleKey("ENTER");
        return;
    }
    if (e.key === "Backspace") {
        handleKey("BKSP");
        return;
    }
    const letter = e.key.toUpperCase();
    if (/^[A-Z]$/.test(letter)) handleKey(letter);
});

document.getElementById("newGameBtn").addEventListener("click", startGame);
document.getElementById("backBtn").addEventListener("click", () => {
    location.href = "../../index.html";
});

async function isValidEnglishWord(word) {
    if (validWordCache.has(word)) return validWordCache.get(word);
    const lower = word.toLowerCase();

    try {
        const dictRes = await fetch("https://api.dictionaryapi.dev/api/v2/entries/en/" + lower);
        if (dictRes.ok) {
            validWordCache.set(word, true);
            return true;
        }
        if (dictRes.status === 404) {
            validWordCache.set(word, false);
            return false;
        }
    } catch (err) {
        // continue with secondary source
    }

    try {
        const wikiRes = await fetch(
            "https://en.wiktionary.org/w/api.php?action=query&titles=" +
            encodeURIComponent(lower) +
            "&format=json&origin=*"
        );
        if (wikiRes.ok) {
            const data = await wikiRes.json();
            const pages = (data && data.query && data.query.pages) || {};
            const hasEntry = Object.values(pages).some((page) => !Object.prototype.hasOwnProperty.call(page, "missing"));
            validWordCache.set(word, hasEntry);
            return hasEntry;
        }
    } catch (err) {
        // continue to local fallback
    }

    // Offline fallback keeps gameplay usable if network lookups fail.
    const fallback = WORDS.includes(word);
    validWordCache.set(word, fallback);
    return fallback;
}

startGame();
