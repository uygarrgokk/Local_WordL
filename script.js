const WORD_LENGTH = 5;
const MAX_GUESSES = 6;

const TURKISH_LAYOUT = [
  ["E", "R", "T", "Y", "U", "I", "O", "P", "Ğ", "Ü"],
  ["A", "S", "D", "F", "G", "H", "J", "K", "L", "Ş", "İ"],
  ["ENTER", "Z", "C", "V", "B", "N", "M", "Ö", "Ç", "⌫"]
];

const boardEl = document.getElementById("board");
const keyboardEl = document.getElementById("keyboard");
const messageEl = document.getElementById("message");
const endPanelEl = document.getElementById("end-panel");
const endTextEl = document.getElementById("end-text");
const playAgainBtn = document.getElementById("play-again");
const appEl = document.querySelector(".app");

let secretWord = "";
let currentRow = 0;
let currentCol = 0;
let gameOver = false;
let tiles = [];
let keyStates = {};

function normalize(str) {
  return str.toLocaleUpperCase("tr-TR");
}

function pickSecretWord() {
  return VALID_WORDS[Math.floor(Math.random() * VALID_WORDS.length)];
}

function isValidWord(word) {
  return VALID_WORDS.includes(normalize(word));
}

function buildBoard() {
  boardEl.innerHTML = "";
  tiles = [];

  for (let r = 0; r < MAX_GUESSES; r++) {
    const rowEl = document.createElement("div");
    rowEl.className = "row";
    const rowTiles = [];

    for (let c = 0; c < WORD_LENGTH; c++) {
      const tile = document.createElement("div");
      tile.className = "tile";
      rowEl.appendChild(tile);
      rowTiles.push(tile);
    }

    boardEl.appendChild(rowEl);
    tiles.push(rowTiles);
  }
}

function buildKeyboard() {
  keyboardEl.innerHTML = "";

  TURKISH_LAYOUT.forEach(row => {
    const rowEl = document.createElement("div");
    rowEl.className = "keyboard-row";

    row.forEach(key => {
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "key";
      btn.dataset.key = key;
      btn.textContent = key === "ENTER" ? "GİR" : key === "⌫" ? "SİL" : key;

      // GİR ve SİL tuşları daha geniş olsun
      if (key === "ENTER" || key === "⌫") {
        btn.classList.add("wide");
      }

      btn.addEventListener("mousedown", e => e.preventDefault());
      btn.addEventListener("click", () => {
        handleKey(key);
        focusGame();
      });

      rowEl.appendChild(btn);
    });

    keyboardEl.appendChild(rowEl);
  });
}

function showMessage(text, isError = false, duration = 2000) {
  messageEl.textContent = text;
  messageEl.className = "message show" + (isError ? " error" : "");
  clearTimeout(showMessage._timer);
  showMessage._timer = setTimeout(() => {
    messageEl.className = "message";
  }, duration);
}

function evaluateGuess(guess) {
  const secret = [...secretWord];
  const result = Array(WORD_LENGTH).fill("absent");
  const remaining = [...secret];

  for (let i = 0; i < WORD_LENGTH; i++) {
    if (guess[i] === secret[i]) {
      result[i] = "correct";
      remaining[i] = null;
    }
  }

  for (let i = 0; i < WORD_LENGTH; i++) {
    if (result[i] === "correct") continue;
    const idx = remaining.indexOf(guess[i]);
    if (idx !== -1) {
      result[i] = "present";
      remaining[idx] = null;
    }
  }

  return result;
}

function updateKeyStates(guess, result) {
  for (let i = 0; i < WORD_LENGTH; i++) {
    const letter = guess[i];
    const status = result[i];
    const current = keyStates[letter];

    if (current === "correct") continue;
    if (current === "present" && status === "absent") continue;

    keyStates[letter] = status;
    const keyBtn = keyboardEl.querySelector(`[data-key="${letter}"]`);
    if (keyBtn) {
      keyBtn.classList.remove("correct", "present", "absent");
      keyBtn.classList.add(status);
    }
  }
}

function revealRow(rowIndex, guess, result) {
  return new Promise(resolve => {
    tiles[rowIndex].forEach((tile, i) => {
      setTimeout(() => {
        tile.classList.add("flip", result[i]);
        tile.textContent = guess[i];
        if (i === WORD_LENGTH - 1) setTimeout(resolve, 300);
      }, i * 300);
    });
  });
}

function shakeRow(rowIndex) {
  const rowEl = boardEl.children[rowIndex];
  rowEl.classList.add("shake");
  setTimeout(() => rowEl.classList.remove("shake"), 500);
}

async function submitGuess() {
  if (gameOver) return;

  const rowTiles = tiles[currentRow];
  const guess = rowTiles.map(t => t.textContent).join("");

  if (guess.length < WORD_LENGTH) {
    showMessage("5 harf girmelisiniz!", true);
    shakeRow(currentRow);
    return;
  }

  if (!isValidWord(guess)) {
    showMessage("Geçerli bir kelime değil!", true);
    shakeRow(currentRow);
    return;
  }

  const guessLetters = [...normalize(guess)];
  const result = evaluateGuess(guessLetters);

  await revealRow(currentRow, guessLetters, result);
  updateKeyStates(guessLetters, result);

  if (guessLetters.join("") === secretWord) {
    gameOver = true;
    const attempts = currentRow + 1;
    showMessage(`Tebrikler! ${attempts}. denemede buldunuz!`, false, 4000);
    showEndPanel(true, attempts);
    return;
  }

  currentRow++;
  currentCol = 0;

  if (currentRow >= MAX_GUESSES) {
    gameOver = true;
    showMessage(`Maalesef! Kelime: ${secretWord}`, false, 4000);
    showEndPanel(false);
  }
}

function handleKey(key) {
  if (gameOver) return;

  if (key === "⌫" || key === "BACKSPACE") {
    if (currentCol > 0) {
      currentCol--;
      tiles[currentRow][currentCol].textContent = "";
      tiles[currentRow][currentCol].classList.remove("filled");
    }
    return;
  }

  if (key === "ENTER") {
    submitGuess();
    return;
  }

  const letter = normalize(key);
  if (letter.length !== 1 || currentCol >= WORD_LENGTH) return;

  tiles[currentRow][currentCol].textContent = letter;
  tiles[currentRow][currentCol].classList.add("filled");
  currentCol++;
}

function showEndPanel(won, attempts) {
  endTextEl.textContent = won
    ? `${attempts}. denemede kazandınız!`
    : `Kaybettiniz. Kelime: ${secretWord}`;
  endPanelEl.classList.remove("hidden");
}

function initGame() {
  secretWord = pickSecretWord();
  currentRow = 0;
  currentCol = 0;
  gameOver = false;
  keyStates = {};
  buildBoard();
  buildKeyboard();
  endPanelEl.classList.add("hidden");
  messageEl.className = "message";
}

function focusGame() {
  appEl.focus({ preventScroll: true });
}

function onKeyDown(e) {
  if (e.ctrlKey || e.metaKey || e.altKey) return;
  if (!(e.key === "Enter" || e.key === "Backspace" || e.key.length === 1)) return;

  e.preventDefault();

  if (e.key === "Enter") handleKey("ENTER");
  else if (e.key === "Backspace") handleKey("⌫");
  else handleKey(e.key);
}

// Tarayıcının geri gitmesini engelle
history.pushState(null, "", location.href);
window.addEventListener("popstate", () => {
  history.pushState(null, "", location.href);
});

document.addEventListener("keydown", onKeyDown, true);
appEl.addEventListener("click", focusGame);
playAgainBtn.addEventListener("click", () => {
  initGame();
  focusGame();
});

focusGame();
initGame();
