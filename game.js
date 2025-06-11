const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');
const levelElem = document.getElementById('level');
const linesElem = document.getElementById('lines');

const COLS = 10;
const ROWS = 20;
const BLOCK = 20;

const COLORS = ['cyan', 'blue', 'orange', 'yellow', 'green', 'purple', 'red'];

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
let lines = 0;
let interval = null;

let current = null;

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
  ctx.fillStyle = COLORS[colorIndex];
  ctx.fillRect(x * BLOCK, y * BLOCK, BLOCK - 1, BLOCK - 1);
}

function draw() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  for (let y = 0; y < ROWS; y++) {
    for (let x = 0; x < COLS; x++) {
      if (board[y][x]) {
        drawBlock(x, y, board[y][x] - 1);
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
  let cleared = 0;
  for (let y = ROWS - 1; y >= 0; y--) {
    if (board[y].every(v => v !== 0)) {
      board.splice(y, 1);
      board.unshift(Array(COLS).fill(0));
      cleared++;
      y++;
    }
  }
  if (cleared) {
    lines += cleared;
    linesElem.textContent = lines;
    if (lines >= level * 20 && level < 10) {
      level++;
      levelElem.textContent = level;
      startLoop();
    }
  }
}

function startLoop() {
  if (interval) clearInterval(interval);
  const speed = Math.max(100, 1000 - (level - 1) * 100);
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
      board = Array.from({length: ROWS}, () => Array(COLS).fill(0));
      level = 1;
      lines = 0;
      levelElem.textContent = level;
      linesElem.textContent = lines;
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

current = randomPiece();
startLoop();
draw();
