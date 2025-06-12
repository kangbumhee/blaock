const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');
const levelElem = document.getElementById('level');
const linesElem = document.getElementById('lines');
const soundToggle = document.getElementById('sound-toggle');
const startBtn = document.getElementById('start-btn');
const leftBtn = document.getElementById('left-btn');
const rightBtn = document.getElementById('right-btn');
const downBtn = document.getElementById('down-btn');
const rotateBtn = document.getElementById('rotate-btn');

const COLS = 10;
const ROWS = 20;
const BLOCK = 20;

const COLORS = ['cyan', 'blue', 'orange', 'yellow', 'green', 'purple', 'red'];
const GOALS = Array.from({ length: 10 }, (_, i) => (i + 1) * 5);

// 7 Tetris shapes with rotation states
const SHAPES = [
  // I
  [
    [
      [0,0,0,0],
      [1,1,1,1],
      [0,0,0,0],
      [0,0,0,0]
    ],
    [
      [0,0,1,0],
      [0,0,1,0],
      [0,0,1,0],
      [0,0,1,0]
    ],
    [
      [0,0,0,0],
      [1,1,1,1],
      [0,0,0,0],
      [0,0,0,0]
    ],
    [
      [0,0,1,0],
      [0,0,1,0],
      [0,0,1,0],
      [0,0,1,0]
    ]
  ],
  // J
  [
    [
      [1,0,0],
      [1,1,1],
      [0,0,0]
    ],
    [
      [0,1,1],
      [0,1,0],
      [0,1,0]
    ],
    [
      [0,0,0],
      [1,1,1],
      [0,0,1]
    ],
    [
      [0,1,0],
      [0,1,0],
      [1,1,0]
    ]
  ],
  // L
  [
    [
      [0,0,1],
      [1,1,1],
      [0,0,0]
    ],
    [
      [0,1,0],
      [0,1,0],
      [0,1,1]
    ],
    [
      [0,0,0],
      [1,1,1],
      [1,0,0]
    ],
    [
      [1,1,0],
      [0,1,0],
      [0,1,0]
    ]
  ],
  // O
  [
    [
      [0,1,1,0],
      [0,1,1,0],
      [0,0,0,0],
      [0,0,0,0]
    ]
  ],
  // S
  [
    [
      [0,1,1],
      [1,1,0],
      [0,0,0]
    ],
    [
      [0,1,0],
      [0,1,1],
      [0,0,1]
    ],
    [
      [0,0,0],
      [0,1,1],
      [1,1,0]
    ],
    [
      [1,0,0],
      [1,1,0],
      [0,1,0]
    ]
  ],
  // T
  [
    [
      [0,1,0],
      [1,1,1],
      [0,0,0]
    ],
    [
      [0,1,0],
      [0,1,1],
      [0,1,0]
    ],
    [
      [0,0,0],
      [1,1,1],
      [0,1,0]
    ],
    [
      [0,1,0],
      [1,1,0],
      [0,1,0]
    ]
  ],
  // Z
  [
    [
      [1,1,0],
      [0,1,1],
      [0,0,0]
    ],
    [
      [0,0,1],
      [0,1,1],
      [0,1,0]
    ],
    [
      [0,0,0],
      [1,1,0],
      [0,1,1]
    ],
    [
      [0,1,0],
      [1,1,0],
      [1,0,0]
    ]
  ]
];

let board = Array.from({length: ROWS}, () => Array(COLS).fill(0));

let level = 1;
let linesInLevel = 0;
let totalLines = 0;
let interval = null;
let muted = false;
let bgmCtx = null;
let bgmOsc = null;

let current = null;

function updateDisplay() {
  levelElem.textContent = level;
  linesElem.textContent = `${linesInLevel}/${GOALS[level - 1]}`;
}

function resetGame() {
  board = Array.from({ length: ROWS }, () => Array(COLS).fill(0));
  level = 1;
  linesInLevel = 0;
  totalLines = 0;
  updateDisplay();
  current = randomPiece();
  draw();
}

function startGame() {
  resetGame();
  startLoop();
  startBgm();
}

function randomPiece() {
  const type = Math.floor(Math.random() * SHAPES.length);
  const shape = SHAPES[type];
  return {
    x: Math.floor(COLS / 2) - 2,
    y: -1,
    type,
    rotation: 0,
    shape
  };
}

function drawBlock(x, y, colorIndex) {
  if (colorIndex === -1) {
    ctx.fillStyle = '#fff';
  } else {
    ctx.fillStyle = COLORS[colorIndex];
  }
  ctx.fillRect(x * BLOCK, y * BLOCK, BLOCK - 1, BLOCK - 1);
}

function draw() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  for (let y = 0; y < ROWS; y++) {
    for (let x = 0; x < COLS; x++) {
      if (board[y][x]) {
        const c = board[y][x] === -1 ? -1 : board[y][x] - 1;
        drawBlock(x, y, c);
      }
    }
  }
  if (current) {
    const shape = current.shape[current.rotation];
    for (let y = 0; y < shape.length; y++) {
      for (let x = 0; x < shape[y].length; x++) {
        if (shape[y][x]) {
          drawBlock(current.x + x, current.y + y, current.type);
        }
      }
    }
  }
}

function collide(newX, newY, newRotation) {
  const shape = current.shape[newRotation];
  for (let y = 0; y < shape.length; y++) {
    for (let x = 0; x < shape[y].length; x++) {
      if (shape[y][x]) {
        const px = newX + x;
        const py = newY + y;
        if (px < 0 || px >= COLS || py >= ROWS) {
          return true;
        }
        if (py >= 0 && board[py][px]) {
          return true;
        }
      }
    }
  }
  return false;
}

function merge() {
  const shape = current.shape[current.rotation];
  for (let y = 0; y < shape.length; y++) {
    for (let x = 0; x < shape[y].length; x++) {
      if (shape[y][x] && current.y + y >= 0) {
        board[current.y + y][current.x + x] = current.type + 1;
      }
    }
  }
}

function clearLines() {
  const linesToRemove = [];
  for (let y = ROWS - 1; y >= 0; y--) {
    if (board[y].every(v => v !== 0)) {
      linesToRemove.push(y);
    }
  }
  if (!linesToRemove.length) return;

  linesToRemove.forEach(y => {
    board[y] = Array(COLS).fill(-1);
  });
  draw();
  playEffect();

  setTimeout(() => {
    linesToRemove.forEach(y => {
      board.splice(y, 1);
      board.unshift(Array(COLS).fill(0));
    });

    const cleared = linesToRemove.length;
    totalLines += cleared;
    linesInLevel += cleared;

    if (linesInLevel >= GOALS[level - 1]) {
      if (level === 10) {
        alert('Congratulations! You cleared the game!');
        stopBgm();
        clearInterval(interval);
        current = null;
        draw();
        return;
      }
      level++;
      linesInLevel = 0;
      startLoop();
    }

    updateDisplay();
    draw();
  }, 150);
}

function startLoop() {
  if (interval) clearInterval(interval);
  const speed = Math.max(100, 1000 - (level - 1) * 80);
  interval = setInterval(() => {
    move(0, 1);
  }, speed);
}

function move(dx, dy) {
  if (!current) return;
  if (!collide(current.x + dx, current.y + dy, current.rotation)) {
    current.x += dx;
    current.y += dy;
  } else if (dy === 1) {
    merge();
    clearLines();
    current = randomPiece();
    if (collide(current.x, current.y, current.rotation)) {
      alert('Game Over');
      clearInterval(interval);
      stopBgm();
      current = null;
    }
  }
  draw();
}

function rotate() {
  const newRotation = (current.rotation + 1) % current.shape.length;
  if (!collide(current.x, current.y, newRotation)) {
    current.rotation = newRotation;
    draw();
  }
}

document.addEventListener('keydown', e => {
  switch (e.key) {
    case 'ArrowLeft':
      move(-1, 0);
      break;
    case 'ArrowRight':
      move(1, 0);
      break;
    case 'ArrowDown':
      move(0, 1);
      break;
    case 'ArrowUp':
      rotate();
      break;
  }
});

startBtn.addEventListener('click', startGame);
leftBtn.addEventListener('click', () => move(-1, 0));
rightBtn.addEventListener('click', () => move(1, 0));
downBtn.addEventListener('click', () => move(0, 1));
rotateBtn.addEventListener('click', rotate);

// touch controls for mobile
document.getElementById('touch-left')?.addEventListener('touchstart', e => {
  e.preventDefault();
  move(-1, 0);
});
document.getElementById('touch-right')?.addEventListener('touchstart', e => {
  e.preventDefault();
  move(1, 0);
});
document.getElementById('touch-down')?.addEventListener('touchstart', e => {
  e.preventDefault();
  move(0, 1);
});
canvas.addEventListener('touchstart', e => {
  e.preventDefault();
  rotate();
});

soundToggle.addEventListener('click', () => {
  muted = !muted;
  soundToggle.textContent = muted ? '🔇' : '🔊';
  if (muted) {
    stopBgm();
  } else {
    startBgm();
  }
});

function playEffect() {
  if (muted) return;
  const ctx = new (window.AudioContext || window.webkitAudioContext)();
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.connect(gain);
  gain.connect(ctx.destination);
  osc.frequency.value = 880;
  gain.gain.value = 0.1;
  osc.start();
  setTimeout(() => {
    osc.stop();
    ctx.close();
  }, 100);
}

function startBgm() {
  if (muted || bgmCtx) return;
  bgmCtx = new (window.AudioContext || window.webkitAudioContext)();
  bgmOsc = bgmCtx.createOscillator();
  const gain = bgmCtx.createGain();
  bgmOsc.connect(gain);
  gain.connect(bgmCtx.destination);
  bgmOsc.frequency.value = 220;
  gain.gain.value = 0.05;
  bgmOsc.start();
}

function stopBgm() {
  if (!bgmCtx) return;
  bgmOsc.stop();
  bgmCtx.close();
  bgmOsc = null;
  bgmCtx = null;
}

draw();
