const canvas = document.getElementById("game");
const context = canvas.getContext("2d");
const scoreElement = document.getElementById("score");
const bestScoreElement = document.getElementById("best-score");
const statusElement = document.getElementById("status");
const startButton = document.getElementById("start-button");
const pauseButton = document.getElementById("pause-button");
const resetButton = document.getElementById("reset-button");
const touchButtons = document.querySelectorAll(".touch-button");
const difficultySelect = document.getElementById("difficulty-select");
const wrapToggle = document.getElementById("wrap-toggle");
const overlayElement = document.getElementById("game-over-overlay");
const finalScoreElement = document.getElementById("final-score");
const overlayRestartButton = document.getElementById("overlay-restart-button");

const gridSize = 20;
const tileSize = canvas.width / gridSize;
const difficultySpeeds = {
  easy: 190,
  normal: 140,
  hard: 95
};
const specialFoodChance = 0.22;
const speedStep = 6;
const minTickSpeed = 70;

let snake;
let direction;
let nextDirection;
let food;
let score;
let bestScore = Number(localStorage.getItem("snake-best-score")) || 0;
let gameInterval = null;
let isRunning = false;
let isGameOver = false;
let isPaused = false;
let currentTickSpeed = difficultySpeeds.normal;
let audioContext = null;
let touchStartPoint = null;

bestScoreElement.textContent = String(bestScore);

function createStartingSnake() {
  return [
    { x: 10, y: 10 },
    { x: 9, y: 10 },
    { x: 8, y: 10 }
  ];
}

function resetGame() {
  snake = createStartingSnake();
  direction = { x: 1, y: 0 };
  nextDirection = { x: 1, y: 0 };
  score = 0;
  food = spawnFood();
  currentTickSpeed = getTickSpeed();
  updateScore();
  statusElement.textContent = "Press Start to begin.";
  isRunning = false;
  isGameOver = false;
  isPaused = false;
  pauseButton.textContent = "Pause";
  hideOverlay();

  if (gameInterval) {
    clearInterval(gameInterval);
    gameInterval = null;
  }

  drawGame();
}

function startGame() {
  if (isRunning) {
    return;
  }

  if (isGameOver) {
    resetGame();
  }

  isRunning = true;
  isPaused = false;
  pauseButton.textContent = "Pause";
  statusElement.textContent = buildStatusMessage("Game in progress.");
  restartLoop();
}

function pauseGame() {
  if (!isRunning) {
    return;
  }

  isRunning = false;
  isPaused = true;
  clearInterval(gameInterval);
  gameInterval = null;
  pauseButton.textContent = "Resume";
  statusElement.textContent = "Game paused.";
}

function resumeGame() {
  if (!isPaused || isGameOver) {
    return;
  }

  isRunning = true;
  isPaused = false;
  pauseButton.textContent = "Pause";
  statusElement.textContent = buildStatusMessage("Game in progress.");
  restartLoop();
}

function togglePause() {
  if (isRunning) {
    pauseGame();
  } else if (isPaused) {
    resumeGame();
  }
}

function gameLoop() {
  direction = nextDirection;

  const head = snake[0];
  const newHead = getNextHeadPosition(head);

  const willEatFood = newHead.x === food.x && newHead.y === food.y;

  if (hitsWall(newHead) || hitsSnake(newHead, willEatFood)) {
    endGame();
    return;
  }

  snake.unshift(newHead);

  if (willEatFood) {
    const ateSpecialFood = food.type === "special";
    score += food.points;
    updateScore();
    playTone(ateSpecialFood ? 720 : 520, 0.08, "triangle");
    food = spawnFood();
    statusElement.textContent = buildStatusMessage(
      ateSpecialFood ? "Lucky find. Keep going." : "Nice. Keep going."
    );
  } else {
    snake.pop();
  }

  drawGame();
}

function hitsWall(position) {
  if (wrapToggle.checked) {
    return false;
  }

  return (
    position.x < 0 ||
    position.x >= gridSize ||
    position.y < 0 ||
    position.y >= gridSize
  );
}

function hitsSnake(position, willEatFood) {
  const segmentsToCheck = willEatFood ? snake : snake.slice(0, -1);
  return segmentsToCheck.some(
    (segment) => segment.x === position.x && segment.y === position.y
  );
}

function spawnFood() {
  let newFood;

  do {
    newFood = {
      x: Math.floor(Math.random() * gridSize),
      y: Math.floor(Math.random() * gridSize)
    };
  } while (snake && snake.some((segment) => segment.x === newFood.x && segment.y === newFood.y));

  newFood.type = Math.random() < specialFoodChance ? "special" : "normal";
  newFood.points = newFood.type === "special" ? 3 : 1;
  return newFood;
}

function updateScore() {
  scoreElement.textContent = String(score);
  updateGameSpeed();

  if (score > bestScore) {
    bestScore = score;
    localStorage.setItem("snake-best-score", String(bestScore));
    bestScoreElement.textContent = String(bestScore);
  }
}

function endGame() {
  isRunning = false;
  isGameOver = true;
  isPaused = false;
  clearInterval(gameInterval);
  gameInterval = null;
  pauseButton.textContent = "Pause";
  statusElement.textContent = "Game over. Press Start to try again.";
  finalScoreElement.textContent = String(score);
  showOverlay();
  playTone(180, 0.18, "sawtooth");
}

function drawGame() {
  drawBoard();
  drawFood();
  drawSnake();
}

function drawBoard() {
  context.clearRect(0, 0, canvas.width, canvas.height);

  for (let y = 0; y < gridSize; y += 1) {
    for (let x = 0; x < gridSize; x += 1) {
      context.fillStyle = (x + y) % 2 === 0 ? "#efe6cf" : "#f7f2e4";
      context.fillRect(x * tileSize, y * tileSize, tileSize, tileSize);
    }
  }
}

function drawFood() {
  context.fillStyle = food.type === "special" ? "#d49b18" : "#c84b31";
  context.beginPath();
  context.arc(
    food.x * tileSize + tileSize / 2,
    food.y * tileSize + tileSize / 2,
    tileSize / 2.8,
    0,
    Math.PI * 2
  );
  context.fill();

  if (food.type === "special") {
    context.fillStyle = "#fff7d6";
    context.font = `${tileSize * 0.55}px Trebuchet MS`;
    context.textAlign = "center";
    context.textBaseline = "middle";
    context.fillText(
      "*",
      food.x * tileSize + tileSize / 2,
      food.y * tileSize + tileSize / 2 + 1
    );
  }
}

function drawSnake() {
  snake.forEach((segment, index) => {
    context.fillStyle = index === 0 ? "#184e34" : "#2f855a";
    context.fillRect(
      segment.x * tileSize + 1,
      segment.y * tileSize + 1,
      tileSize - 2,
      tileSize - 2
    );
  });
}

function setDirection(newX, newY) {
  const wouldReverse =
    snake.length > 1 &&
    newX === -direction.x &&
    newY === -direction.y;

  if (!wouldReverse) {
    nextDirection = { x: newX, y: newY };
  }
}

function handleDirectionInput(directionName) {
  if (directionName === "up") {
    setDirection(0, -1);
  } else if (directionName === "down") {
    setDirection(0, 1);
  } else if (directionName === "left") {
    setDirection(-1, 0);
  } else if (directionName === "right") {
    setDirection(1, 0);
  }
}

document.addEventListener("keydown", (event) => {
  const key = event.key.toLowerCase();

  if (["arrowup", "arrowdown", "arrowleft", "arrowright", "w", "a", "s", "d"].includes(key)) {
    event.preventDefault();
  }

  if (key === "arrowup" || key === "w") {
    handleDirectionInput("up");
  } else if (key === "arrowdown" || key === "s") {
    handleDirectionInput("down");
  } else if (key === "arrowleft" || key === "a") {
    handleDirectionInput("left");
  } else if (key === "arrowright" || key === "d") {
    handleDirectionInput("right");
  } else if (key === " ") {
    startGame();
  } else if (key === "p") {
    togglePause();
  }
});

touchButtons.forEach((button) => {
  button.addEventListener("click", () => {
    handleDirectionInput(button.dataset.direction);

    if (!isRunning && !isPaused) {
      startGame();
    }
  });
});

canvas.addEventListener("touchstart", (event) => {
  const touch = event.changedTouches[0];
  touchStartPoint = { x: touch.clientX, y: touch.clientY };
}, { passive: true });

canvas.addEventListener("touchend", (event) => {
  if (!touchStartPoint) {
    return;
  }

  const touch = event.changedTouches[0];
  const deltaX = touch.clientX - touchStartPoint.x;
  const deltaY = touch.clientY - touchStartPoint.y;
  const absX = Math.abs(deltaX);
  const absY = Math.abs(deltaY);
  const threshold = 20;

  touchStartPoint = null;

  if (Math.max(absX, absY) < threshold) {
    return;
  }

  if (absX > absY) {
    handleDirectionInput(deltaX > 0 ? "right" : "left");
  } else {
    handleDirectionInput(deltaY > 0 ? "down" : "up");
  }

  if (!isRunning && !isPaused) {
    startGame();
  }
}, { passive: true });

difficultySelect.addEventListener("change", () => {
  currentTickSpeed = getTickSpeed();

  if (isRunning) {
    restartLoop();
    statusElement.textContent = buildStatusMessage("Difficulty updated.");
  }
});

wrapToggle.addEventListener("change", () => {
  statusElement.textContent = buildStatusMessage(
    wrapToggle.checked ? "Wrap mode on." : "Wrap mode off."
  );
});

startButton.addEventListener("click", startGame);
pauseButton.addEventListener("click", togglePause);
resetButton.addEventListener("click", resetGame);
overlayRestartButton.addEventListener("click", () => {
  resetGame();
  startGame();
});

resetGame();

function getTickSpeed() {
  const baseSpeed = difficultySpeeds[difficultySelect.value] || difficultySpeeds.normal;
  return Math.max(minTickSpeed, baseSpeed - score * speedStep);
}

function updateGameSpeed() {
  const nextTickSpeed = getTickSpeed();

  if (nextTickSpeed !== currentTickSpeed) {
    currentTickSpeed = nextTickSpeed;

    if (isRunning) {
      restartLoop();
    }
  }
}

function restartLoop() {
  clearInterval(gameInterval);
  gameInterval = setInterval(gameLoop, currentTickSpeed);
}

function getNextHeadPosition(head) {
  const nextPosition = {
    x: head.x + direction.x,
    y: head.y + direction.y
  };

  if (wrapToggle.checked) {
    nextPosition.x = (nextPosition.x + gridSize) % gridSize;
    nextPosition.y = (nextPosition.y + gridSize) % gridSize;
  }

  return nextPosition;
}

function buildStatusMessage(message) {
  return `${message} Speed: ${Math.round(1000 / currentTickSpeed)} tiles/sec.`;
}

function showOverlay() {
  overlayElement.classList.remove("hidden");
}

function hideOverlay() {
  overlayElement.classList.add("hidden");
}

function playTone(frequency, duration, type) {
  const AudioContextClass = window.AudioContext || window.webkitAudioContext;

  if (!AudioContextClass) {
    return;
  }

  if (!audioContext) {
    audioContext = new AudioContextClass();
  }

  if (audioContext.state === "suspended") {
    audioContext.resume();
  }

  const oscillator = audioContext.createOscillator();
  const gainNode = audioContext.createGain();
  const now = audioContext.currentTime;

  oscillator.type = type;
  oscillator.frequency.setValueAtTime(frequency, now);
  gainNode.gain.setValueAtTime(0.001, now);
  gainNode.gain.exponentialRampToValueAtTime(0.08, now + 0.01);
  gainNode.gain.exponentialRampToValueAtTime(0.001, now + duration);

  oscillator.connect(gainNode);
  gainNode.connect(audioContext.destination);
  oscillator.start(now);
  oscillator.stop(now + duration);
}
