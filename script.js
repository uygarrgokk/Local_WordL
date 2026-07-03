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
const modalEl = document.getElementById("modal");
const modalTitleEl = document.getElementById("modal-title");
const modalTextEl = document.getElementById("modal-text");
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
  const index = Math.floor(Math.random() * VALID_WORDS.length);
  return VALID_WORDS[index];
}

function isValidWord(word) {
  const upper = normalize(word);
  return VALID_WORDS.includes(upper);
}

function buildBoard() {
  boardEl.innerHTML = "";
  tiles = [];

  for (let r = 0; r < MAX_GUESSES; r++) {
    const rowEl = document.createElement("div");
    rowEl.className = "row";
    rowEl.dataset.row = r;
    const rowTiles = [];

    for (let c = 0; c < WORD_LENGTH; c++) {
      const tile = document.createElement("div");
      tile.className = "tile";
      tile.dataset.row = r;
      tile.dataset.col = c;
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

      if (key === "ENTER" || key === "⌫") {
        btn.classList.add("wide");
      }

      btn.addEventListener("mousedown", e => e.preventDefault());
      btn.addEventListener("click", e => {
        e.preventDefault();
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

  // Önce doğru konumdaki harfleri yeşil yap
  for (let i = 0; i < WORD_LENGTH; i++) {
    if (guess[i] === secret[i]) {
      result[i] = "correct";
      remaining[i] = null;
    }
  }

  // Sonra yanlış konumdaki harfleri sarı yap
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
    const rowTiles = tiles[rowIndex];

    rowTiles.forEach((tile, i) => {
      setTimeout(() => {
        tile.classList.add("flip");
        tile.classList.add(result[i]);
        tile.textContent = guess[i];

        if (i === WORD_LENGTH - 1) {
          setTimeout(resolve, 300);
        }
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
    showMessage(`Tebrikler! ${attempts}. denemede buldunuz! 🎉`, false, 4000);
    setTimeout(() => showEndModal(true, attempts), 1500);
    return;
  }

  currentRow++;
  currentCol = 0;

  if (currentRow >= MAX_GUESSES) {
    gameOver = true;
    showMessage(`Maalesef! Kelime: ${secretWord}`, false, 4000);
    setTimeout(() => showEndModal(false), 1500);
  }
}

function handleKey(key) {
  if (gameOver) return;

  const normalizedKey = normalize(key);

  if (key === "⌫" || key === "BACKSPACE") {
    if (currentCol > 0) {
      currentCol--;
      const tile = tiles[currentRow][currentCol];
      tile.textContent = "";
      tile.classList.remove("filled");
    }
    return;
  }

  if (key === "ENTER") {
    submitGuess();
    return;
  }

  if (normalizedKey.length !== 1) return;
  if (currentCol >= WORD_LENGTH) return;

  const tile = tiles[currentRow][currentCol];
  tile.textContent = normalizedKey;
  tile.classList.add("filled");
  currentCol++;
}

function showEndModal(won, attempts) {
  modalTitleEl.textContent = won ? "Kazandınız! 🎉" : "Kaybettiniz";
  modalTextEl.textContent = won
    ? `${attempts} denemede doğru kelimeyi buldunuz.`
    : `Doğru kelime "${secretWord}" idi. Tekrar denemek ister misiniz?`;
  modalEl.classList.remove("hidden");
}

function initGame() {
  secretWord = pickSecretWord();
  currentRow = 0;
  currentCol = 0;
  gameOver = false;
  keyStates = {};

  buildBoard();
  buildKeyboard();
  modalEl.classList.add("hidden");
  messageEl.className = "message";

}

function focusGame() {
  appEl.focus({ preventScroll: true });
}

function isGameKey(e) {
  if (e.ctrlKey || e.metaKey || e.altKey) return false;
  if (e.key === "Enter" || e.key === "Backspace") return true;
  return e.key.length === 1;
}

function onKeyDown(e) {
  if (!isGameKey(e)) return;

  e.preventDefault();
  e.stopImmediatePropagation();

  if (e.key === "Enter") {
    handleKey("ENTER");
  } else if (e.key === "Backspace") {
    handleKey("⌫");
  } else if (e.key.length === 1) {
    handleKey(e.key);
  }
}

function blockBrowserBack() {
  history.pushState({ game: true }, "", location.href);
  window.addEventListener("popstate", () => {
    history.pushState({ game: true }, "", location.href);
  });
}

document.addEventListener("keydown", onKeyDown, true);
document.addEventListener("keyup", e => {
  if (e.key === "Backspace") {
    e.preventDefault();
  }
}, true);

appEl.addEventListener("click", focusGame);
playAgainBtn.addEventListener("click", () => {
  initGame();
  focusGame();
});

blockBrowserBack();
focusGame();

initGame();
