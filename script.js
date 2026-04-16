const canvas = document.getElementById("game");
const context = canvas.getContext("2d");
const scoreElement = document.getElementById("score");
const bestScoreElement = document.getElementById("best-score");
const statusElement = document.getElementById("status");
const startButton = document.getElementById("start-button");
const resetButton = document.getElementById("reset-button");

const gridSize = 20;
const tileSize = canvas.width / gridSize;
const tickSpeed = 140;

let snake;
let direction;
let nextDirection;
let food;
let score;
let bestScore = Number(localStorage.getItem("snake-best-score")) || 0;
let gameInterval = null;
let isRunning = false;
let isGameOver = false;

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
  updateScore();
  statusElement.textContent = "Press Start to begin.";
  isRunning = false;
  isGameOver = false;

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
  statusElement.textContent = "Game in progress.";
  gameInterval = setInterval(gameLoop, tickSpeed);
}

function gameLoop() {
  direction = nextDirection;

  const head = snake[0];
  const newHead = {
    x: head.x + direction.x,
    y: head.y + direction.y
  };

  const willEatFood = newHead.x === food.x && newHead.y === food.y;

  if (hitsWall(newHead) || hitsSnake(newHead, willEatFood)) {
    endGame();
    return;
  }

  snake.unshift(newHead);

  if (willEatFood) {
    score += 1;
    updateScore();
    food = spawnFood();
    statusElement.textContent = "Nice. Keep going.";
  } else {
    snake.pop();
  }

  drawGame();
}

function hitsWall(position) {
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

  return newFood;
}

function updateScore() {
  scoreElement.textContent = String(score);

  if (score > bestScore) {
    bestScore = score;
    localStorage.setItem("snake-best-score", String(bestScore));
    bestScoreElement.textContent = String(bestScore);
  }
}

function endGame() {
  isRunning = false;
  isGameOver = true;
  clearInterval(gameInterval);
  gameInterval = null;
  statusElement.textContent = "Game over. Press Start to try again.";
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
  context.fillStyle = "#c84b31";
  context.beginPath();
  context.arc(
    food.x * tileSize + tileSize / 2,
    food.y * tileSize + tileSize / 2,
    tileSize / 2.8,
    0,
    Math.PI * 2
  );
  context.fill();
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

document.addEventListener("keydown", (event) => {
  const key = event.key.toLowerCase();

  if (["arrowup", "arrowdown", "arrowleft", "arrowright", "w", "a", "s", "d"].includes(key)) {
    event.preventDefault();
  }

  if (key === "arrowup" || key === "w") {
    setDirection(0, -1);
  } else if (key === "arrowdown" || key === "s") {
    setDirection(0, 1);
  } else if (key === "arrowleft" || key === "a") {
    setDirection(-1, 0);
  } else if (key === "arrowright" || key === "d") {
    setDirection(1, 0);
  } else if (key === " ") {
    startGame();
  }
});

startButton.addEventListener("click", startGame);
resetButton.addEventListener("click", resetGame);

resetGame();
