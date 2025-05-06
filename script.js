// Haunted Snake Game - JavaScript
const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");
const box = 20;
const rows = canvas.height / box;
const cols = canvas.width / box;

let snake = [];
let direction = "RIGHT";
let food;
let game;
let score = 0;

let specialItem = null;
let specialEffect = null;
let specialTimeout = null;
let speed = 150;
let scores = [];
let enemies = [];

const skullImg = new Image();
skullImg.src = "https://i.imgur.com/Z3mlDiS.png"; // 骷髏圖示
const ghostImg = new Image();
ghostImg.src = "https://i.imgur.com/OUhFkcC.png"; // 鬼魂圖示
const tombImg = new Image();
tombImg.src = "https://i.imgur.com/8UEJvGW.png"; // 墳墓圖示

const deathSound = new Audio("https://www.soundjay.com/human/sounds/scream-01.mp3");

function randomPosition() {
  return {
    x: Math.floor(Math.random() * cols) * box,
    y: Math.floor(Math.random() * rows) * box
  };
}

document.getElementById("startBtn").addEventListener("click", () => {
  initGame();
});

document.addEventListener("keydown", changeDirection);

function initGame() {
  snake = [{ x: 9 * box, y: 10 * box }];
  direction = "RIGHT";
  food = randomPosition();
  score = 0;
  specialItem = null;
  specialEffect = null;
  clearTimeout(specialTimeout);
  clearInterval(game);
  speed = 150;
  enemies = generateEnemies();
  game = setInterval(draw, speed);
  updateItemDescription(null);
}

function generateEnemies() {
  const e = [];
  for (let i = 0; i < 2; i++) {
    let enemy = [];
    let pos = randomPosition();
    for (let j = 0; j < 5; j++) {
      enemy.push({ x: pos.x - j * box, y: pos.y });
    }
    e.push({
      body: enemy,
      dir: ["UP", "DOWN", "LEFT", "RIGHT"][Math.floor(Math.random() * 4)],
      color: getRandomColor()
    });
  }
  return e;
}

function getRandomColor() {
  const colors = ["#ffbb33", "#33b5e5", "#aa66cc"];
  return colors[Math.floor(Math.random() * colors.length)];
}

function draw() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.drawImage(skullImg, 0, 0, 40, 40);
  ctx.drawImage(ghostImg, canvas.width - 40, canvas.height - 40, 40, 40);

  // 畫蛇
  snake.forEach((segment, index) => {
    ctx.beginPath();
    ctx.fillStyle = index === 0 ? "#00e676" : "#66bb6a";
    ctx.arc(segment.x + box / 2, segment.y + box / 2, box / 2 - 2, 0, Math.PI * 2);
    ctx.fill();
    if (index === 0) drawEyes(segment);
  });

  // 畫敵人
enemies.forEach(enemy => {
  enemy.body.forEach((seg, idx) => {
    // 畫身體
    ctx.beginPath();
    ctx.fillStyle = enemy.color;
    ctx.arc(seg.x + box / 2, seg.y + box / 2, box / 2 - 1, 0, Math.PI * 2);
    ctx.fill();

    // 如果是頭部（第0節），畫眼睛
    if (idx === 0) {
      const eyeRadius = 2;
      const eyeOffsetX = 5;
      const eyeOffsetY = 5;

      // 左眼
      ctx.beginPath();
      ctx.fillStyle = "#000"; // 黑色眼睛
      ctx.arc(seg.x + box / 2 - eyeOffsetX, seg.y + box / 2 - eyeOffsetY, eyeRadius, 0, Math.PI * 2);
      ctx.fill();

      // 右眼
      ctx.beginPath();
      ctx.arc(seg.x + box / 2 + eyeOffsetX, seg.y + box / 2 - eyeOffsetY, eyeRadius, 0, Math.PI * 2);
      ctx.fill();
    }
  });
});


  // 畫食物
  ctx.fillStyle = "#e74c3c";
  ctx.beginPath();
  ctx.arc(food.x + box / 2, food.y + box / 2, box / 2 - 2, 0, Math.PI * 2);
  ctx.fill();

  if (!specialItem && Math.random() < 0.02) {
    const types = ["star", "slow", "bomb"];
    const type = types[Math.floor(Math.random() * types.length)];
    specialItem = { type, ...randomPosition() };
  }
  if (specialItem) {
    ctx.fillStyle = specialItem.type === "star" ? "gold" : specialItem.type === "slow" ? "cyan" : "purple";
    ctx.beginPath();
    ctx.arc(specialItem.x + box / 2, specialItem.y + box / 2, box / 2 - 3, 0, Math.PI * 2);
    ctx.fill();
    updateItemDescription(specialItem.type);
  }

  enemies.forEach(enemy => moveEnemy(enemy));

  let head = { ...snake[0] };
  if (direction === "LEFT") head.x -= box;
  if (direction === "RIGHT") head.x += box;
  if (direction === "UP") head.y -= box;
  if (direction === "DOWN") head.y += box;

  if (head.x < 0 || head.x >= canvas.width || head.y < 0 || head.y >= canvas.height || collision(head, snake) || enemyCollision(head)) {
    endGame();
    return;
  }

  if (head.x === food.x && head.y === food.y) {
    score += specialEffect === "double" ? 20 : 10;
    food = randomPosition();
  } else {
    snake.pop();
  }

  if (specialItem && head.x === specialItem.x && head.y === specialItem.y) {
    applyEffect(specialItem.type);
    specialItem = null;
  }

  snake.unshift(head);
}

function drawEyes(head) {
  ctx.fillStyle = "white";
  const eyeSize = 4;
  const offset = 4;
  ctx.beginPath();
  ctx.arc(head.x + box / 3, head.y + box / 3, eyeSize, 0, Math.PI * 2);
  ctx.arc(head.x + 2 * box / 3, head.y + box / 3, eyeSize, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = "black";
  ctx.beginPath();
  ctx.arc(head.x + box / 3, head.y + box / 3, eyeSize / 2, 0, Math.PI * 2);
  ctx.arc(head.x + 2 * box / 3, head.y + box / 3, eyeSize / 2, 0, Math.PI * 2);
  ctx.fill();
}

function moveEnemy(enemy) {
  let head = { ...enemy.body[0] };
  let dir = enemy.dir;

  // 偶爾隨機換方向
  if (Math.random() < 0.1) {
    const dirs = ["UP", "DOWN", "LEFT", "RIGHT"];
    dir = dirs[Math.floor(Math.random() * 4)];
    enemy.dir = dir;
  }

  // 預測下一格
  if (dir === "LEFT") head.x -= box;
  if (dir === "RIGHT") head.x += box;
  if (dir === "UP") head.y -= box;
  if (dir === "DOWN") head.y += box;

  // 撞牆處理
  if (head.x < 0 || head.x >= canvas.width || head.y < 0 || head.y >= canvas.height) {
    // 強制換方向
    const dirs = ["UP", "DOWN", "LEFT", "RIGHT"];
    dirs.splice(dirs.indexOf(dir), 1); // 移除原方向
    const newDir = dirs[Math.floor(Math.random() * 3)];
    enemy.dir = newDir;
    return; // 本次不移動，等待下次 tick
  }

  // 確保移動
  enemy.body.pop();
  enemy.body.unshift(head);
}


function changeDirection(e) {
  const key = e.key;
  if (key === "ArrowLeft" && direction !== "RIGHT") direction = "LEFT";
  else if (key === "ArrowUp" && direction !== "DOWN") direction = "UP";
  else if (key === "ArrowRight" && direction !== "LEFT") direction = "RIGHT";
  else if (key === "ArrowDown" && direction !== "UP") direction = "DOWN";
}

function collision(head, array) {
  return array.some(segment => segment.x === head.x && segment.y === head.y);
}

function enemyCollision(head) {
  return enemies.some(enemy => enemy.body.some(seg => seg.x === head.x && seg.y === head.y));
}

function endGame() {
  clearInterval(game);
  scores.push(score);
  updateScoreboard();
  deathSound.play();
  ctx.drawImage(tombImg, snake[0].x, snake[0].y, box, box);
  setTimeout(() => {
    ctx.fillStyle = "rgba(0,0,0,0.8)";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = "red";
    ctx.font = "48px 'Arial Black'";
    ctx.textAlign = "center";
    ctx.fillText("You are dead!!!", canvas.width / 2, canvas.height / 2);
  }, 300);
}

function applyEffect(type) {
  if (type === "star") {
    specialEffect = "double";
    setTimeout(() => (specialEffect = null), 10000);
  } else if (type === "slow") {
    clearInterval(game);
    speed = 180;
    game = setInterval(draw, speed);
    setTimeout(() => {
      specialEffect = null;
      speed = 120;
      clearInterval(game);
      game = setInterval(draw, speed);
    }, 8000);
  } else if (type === "bomb") {
    if (snake.length > 1) {
      snake.splice(-2);
    }
  }
}

function updateItemDescription(type) {
  const desc = document.getElementById("itemDescriptionText");
  if (!type) {
    desc.textContent = "目前沒有特殊道具。";
    return;
  }
  const descriptions = {
    star: "⭐ 雙倍分數（10秒）",
    slow: "🌀 減速（8秒）",
    bomb: "💣 減少蛇身"
  };
  desc.textContent = descriptions[type];
}

function updateScoreboard() {
  const list = document.getElementById("scoreList");
  list.innerHTML = "";
  scores.slice().sort((a, b) => b - a).slice(0, 5).forEach((s, i) => {
    const li = document.createElement("li");
    li.textContent = `第 ${i + 1} 名：${s} 分`;
    list.appendChild(li);
  });
}