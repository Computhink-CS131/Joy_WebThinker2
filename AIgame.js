const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');
const scoreLabel = document.getElementById('score');
const bestLabel = document.getElementById('best');
const messageLabel = document.getElementById('game-message');
const startButton = document.getElementById('start-button');
const pauseButton = document.getElementById('pause-button');

const WIDTH = 960;
const HEIGHT = 540;
const GROUND = 426;
const bestKey = 'neon-runner-best';
function readBestScore() {
  try {
    return Number(localStorage.getItem(bestKey)) || 0;
  } catch {
    return 0;
  }
}

function saveBestScore(value) {
  try {
    localStorage.setItem(bestKey, String(value));
  } catch {
    // The run remains playable when browser storage is disabled.
  }
}

const skyline = Array.from({ length: 19 }, (_, index) => ({
  x: index * 64,
  width: 35 + (index * 19 % 28),
  height: 70 + (index * 37 % 135),
  windows: index % 3 !== 0
}));

let state = 'ready';
let lastTime = 0;
let elapsed = 0;
let distance = 0;
let speed = 360;
let spawnTimer = 1.2;
let obstacles = [];
let particles = [];
let cityOffset = 0;
let flash = 0;
let best = readBestScore();
let slideHeld = false;

const robot = { x: 155, y: GROUND, vy: 0, grounded: true, slide: 0, runPhase: 0 };

function formatScore(value) {
  return String(Math.floor(value)).padStart(5, '0');
}

bestLabel.textContent = formatScore(best);

function startGame() {
  if (state === 'running') return;
  distance = 0;
  speed = 360;
  elapsed = 0;
  spawnTimer = 1.1;
  obstacles = [];
  particles = [];
  robot.y = GROUND;
  robot.vy = 0;
  robot.grounded = true;
  robot.slide = 0;
  slideHeld = false;
  state = 'running';
  messageLabel.textContent = 'RUN IN PROGRESS';
  startButton.innerHTML = 'RESTART <span>↻</span>';
  pauseButton.disabled = false;
  pauseButton.textContent = 'Ⅱ';
  canvas.focus({ preventScroll: true });
}

function finishGame() {
  if (state !== 'running') return;
  state = 'over';
  flash = 0.24;
  messageLabel.textContent = 'SIGNAL LOST · RUN AGAIN';
  startButton.innerHTML = 'RUN AGAIN <span>↗</span>';
  pauseButton.disabled = true;
  if (distance > best) {
    best = distance;
    saveBestScore(best);
    bestLabel.textContent = formatScore(best);
  }
  for (let index = 0; index < 18; index++) {
    particles.push({ x: robot.x + 24, y: robot.y - 35, vx: (Math.random() - .5) * 280, vy: (Math.random() - .7) * 250, life: .65, color: index % 2 ? '#a7f36b' : '#6de3dc' });
  }
}

function jump() {
  if (state === 'ready' || state === 'over') {
    startGame();
    return;
  }
  if (state === 'running' && robot.grounded && robot.slide <= 0) {
    robot.vy = -690;
    robot.grounded = false;
    for (let index = 0; index < 6; index++) {
      particles.push({ x: robot.x + 23, y: GROUND - 5, vx: -90 - Math.random() * 100, vy: -25 - Math.random() * 80, life: .35, color: '#6de3dc' });
    }
  }
}

function togglePause() {
  if (state === 'running') {
    state = 'paused';
    messageLabel.textContent = 'RUN PAUSED';
    pauseButton.textContent = '▶';
  } else if (state === 'paused') {
    state = 'running';
    messageLabel.textContent = 'RUN IN PROGRESS';
    pauseButton.textContent = 'Ⅱ';
    lastTime = performance.now();
  }
}

function spawnObstacle() {
  const roll = Math.random();
  const type = roll < .28 ? 'drone' : (roll < .64 ? 'crate' : 'spikes');
  obstacles.push({ x: WIDTH + 35, type, passed: false, phase: Math.random() * Math.PI * 2 });
}

function update(delta) {
  elapsed += delta;
  speed = Math.min(640, 360 + elapsed * 8);
  distance += speed * delta * .024;
  scoreLabel.textContent = formatScore(distance);
  cityOffset = (cityOffset + speed * delta * .12) % 64;
  robot.runPhase += delta * (speed / 75);

  if (!robot.grounded) {
    robot.vy += 1900 * delta;
    robot.y += robot.vy * delta;
    if (robot.y >= GROUND) {
      robot.y = GROUND;
      robot.vy = 0;
      robot.grounded = true;
    }
  }
  robot.slide = slideHeld && robot.grounded ? Math.min(.18, robot.slide + delta) : Math.max(0, robot.slide - delta * 1.7);

  spawnTimer -= delta;
  if (spawnTimer <= 0) {
    spawnObstacle();
    spawnTimer = Math.max(.82, 1.5 - elapsed * .008) + Math.random() * .5;
  }

  for (const obstacle of obstacles) {
    obstacle.x -= speed * delta;
    if (!obstacle.passed && obstacle.x < robot.x) {
      obstacle.passed = true;
      distance += 8;
    }
  }
  obstacles = obstacles.filter(obstacle => obstacle.x > -100);

  for (const particle of particles) {
    particle.x += particle.vx * delta;
    particle.y += particle.vy * delta;
    particle.vy += 300 * delta;
    particle.life -= delta;
  }
  particles = particles.filter(particle => particle.life > 0);
  flash = Math.max(0, flash - delta);

  const robotBox = robot.slide > .08
    ? { x: robot.x + 5, y: robot.y - 33, width: 59, height: 30 }
    : { x: robot.x + 8, y: robot.y - 67, width: 40, height: 64 };
  for (const obstacle of obstacles) {
    let box;
    if (obstacle.type === 'crate') box = { x: obstacle.x + 4, y: GROUND - 45, width: 43, height: 43 };
    else if (obstacle.type === 'drone') box = { x: obstacle.x + 2, y: GROUND - 85, width: 52, height: 37 };
    else box = { x: obstacle.x + 5, y: GROUND - 34, width: 43, height: 33 };
    if (robotBox.x < box.x + box.width && robotBox.x + robotBox.width > box.x && robotBox.y < box.y + box.height && robotBox.y + robotBox.height > box.y) {
      finishGame();
      break;
    }
  }
}

function roundedRect(context, x, y, width, height, radius) {
  context.beginPath();
  if (typeof context.roundRect === 'function') {
    context.roundRect(x, y, width, height, radius);
    return;
  }
  const corner = Math.min(radius, width / 2, height / 2);
  context.moveTo(x + corner, y);
  context.lineTo(x + width - corner, y);
  context.quadraticCurveTo(x + width, y, x + width, y + corner);
  context.lineTo(x + width, y + height - corner);
  context.quadraticCurveTo(x + width, y + height, x + width - corner, y + height);
  context.lineTo(x + corner, y + height);
  context.quadraticCurveTo(x, y + height, x, y + height - corner);
  context.lineTo(x, y + corner);
  context.quadraticCurveTo(x, y, x + corner, y);
}

function drawBackground() {
  const sky = ctx.createLinearGradient(0, 0, 0, HEIGHT);
  sky.addColorStop(0, '#14212c');
  sky.addColorStop(.58, '#24333a');
  sky.addColorStop(1, '#28363a');
  ctx.fillStyle = sky;
  ctx.fillRect(0, 0, WIDTH, HEIGHT);

  ctx.fillStyle = 'rgba(255, 134, 95, .12)';
  ctx.beginPath();
  ctx.arc(740, 152, 74, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#ffb17c';
  ctx.beginPath();
  ctx.arc(740, 152, 39, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = 'rgba(255, 209, 157, .75)';
  ctx.fillRect(702, 150, 76, 2);

  for (let index = 0; index < 34; index++) {
    const starX = (index * 173 + 37) % WIDTH;
    const starY = (index * 47 + 28) % 190;
    ctx.fillStyle = index % 4 === 0 ? 'rgba(167, 243, 107, .72)' : 'rgba(223, 239, 222, .5)';
    ctx.fillRect(starX, starY, index % 7 === 0 ? 2 : 1, index % 7 === 0 ? 2 : 1);
  }

  for (const building of skyline) {
    const x = ((building.x - cityOffset * .45) % (WIDTH + 64) + WIDTH + 64) % (WIDTH + 64) - 48;
    const top = GROUND - building.height;
    ctx.fillStyle = '#1b292e';
    ctx.fillRect(x, top, building.width, building.height);
    ctx.fillStyle = '#39464a';
    ctx.fillRect(x, top, building.width, 2);
    if (building.windows) {
      for (let row = 0; row < Math.floor(building.height / 18); row++) {
        for (let col = 0; col < 3; col++) {
          if ((row + col + Math.floor(x)) % 3 !== 0) {
            ctx.fillStyle = (row + col) % 2 ? 'rgba(109, 227, 220, .35)' : 'rgba(255, 177, 124, .34)';
            ctx.fillRect(x + 6 + col * 10, top + 10 + row * 17, 3, 5);
          }
        }
      }
    }
  }

  ctx.fillStyle = '#263438';
  ctx.fillRect(0, GROUND, WIDTH, HEIGHT - GROUND);
  ctx.fillStyle = '#a7f36b';
  ctx.fillRect(0, GROUND, WIDTH, 3);
  ctx.fillStyle = 'rgba(167, 243, 107, .13)';
  ctx.fillRect(0, GROUND + 3, WIDTH, 7);
  ctx.strokeStyle = 'rgba(109, 227, 220, .1)';
  ctx.lineWidth = 1;
  for (let line = 0; line < 8; line++) {
    const y = GROUND + 28 + line * line * 2;
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(WIDTH, y);
    ctx.stroke();
  }
  for (let stripe = -1; stripe < 17; stripe++) {
    const x = stripe * 85 - cityOffset * 1.7 % 85;
    ctx.fillStyle = 'rgba(109, 227, 220, .28)';
    ctx.fillRect(x, GROUND + 18, 30, 2);
  }
}

function drawRobot() {
  const slide = robot.slide > .08;
  const bob = robot.grounded && !slide && state === 'running' ? Math.sin(robot.runPhase * 2) * 2 : 0;
  const groundY = robot.y + bob;
  ctx.save();
  ctx.translate(robot.x, groundY);
  if (slide) {
    ctx.translate(0, 25);
    ctx.rotate(-.08);
  }

  ctx.fillStyle = 'rgba(4, 10, 12, .32)';
  ctx.beginPath();
  ctx.ellipse(29, 3, slide ? 40 : 30, 6, 0, 0, Math.PI * 2);
  ctx.fill();

  const legSwing = robot.grounded && !slide ? Math.sin(robot.runPhase * 2) * 9 : 0;
  ctx.strokeStyle = '#b7c8c0';
  ctx.lineWidth = 9;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(20, -23);
  ctx.lineTo(17 - legSwing, -9);
  ctx.lineTo(14 - legSwing, -3);
  ctx.moveTo(37, -23);
  ctx.lineTo(39 + legSwing, -9);
  ctx.lineTo(42 + legSwing, -3);
  ctx.stroke();
  ctx.strokeStyle = '#6de3dc';
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.moveTo(8 - legSwing, -2);
  ctx.lineTo(19 - legSwing, -2);
  ctx.moveTo(36 + legSwing, -2);
  ctx.lineTo(48 + legSwing, -2);
  ctx.stroke();

  ctx.fillStyle = '#b7c8c0';
  roundedRect(ctx, 10, -59, 35, 38, 8);
  ctx.fill();
  ctx.fillStyle = '#7f9895';
  roundedRect(ctx, 15, -54, 25, 27, 5);
  ctx.fill();
  ctx.fillStyle = '#a7f36b';
  roundedRect(ctx, 19, -49, 18, 9, 3);
  ctx.fill();
  ctx.fillStyle = '#263438';
  ctx.fillRect(23, -46, 3, 3);
  ctx.fillRect(31, -46, 3, 3);
  ctx.fillStyle = '#d6e0d7';
  ctx.fillRect(23, -33, 10, 2);

  ctx.fillStyle = '#cfdbd2';
  roundedRect(ctx, 12, -78, 32, 25, 7);
  ctx.fill();
  ctx.fillStyle = '#25373a';
  roundedRect(ctx, 16, -73, 24, 13, 4);
  ctx.fill();
  ctx.fillStyle = '#6de3dc';
  ctx.fillRect(19, -69, 18, 4);
  ctx.fillStyle = '#ff865f';
  ctx.fillRect(45, -72, 4, 4);
  ctx.fillStyle = '#a7f36b';
  ctx.fillRect(7, -50, 5, 8);

  ctx.strokeStyle = '#d4ded6';
  ctx.lineWidth = 7;
  ctx.beginPath();
  ctx.moveTo(13, -51);
  ctx.lineTo(5, -37 + (robot.grounded && !slide ? legSwing * .4 : 0));
  ctx.moveTo(42, -51);
  ctx.lineTo(49, -42 - (robot.grounded && !slide ? legSwing * .4 : 0));
  ctx.stroke();
  ctx.fillStyle = '#ff865f';
  ctx.fillRect(3, -34 + (robot.grounded && !slide ? legSwing * .4 : 0), 6, 5);
  ctx.fillRect(47, -40 - (robot.grounded && !slide ? legSwing * .4 : 0), 6, 5);
  ctx.restore();
}

function drawObstacle(obstacle) {
  const x = obstacle.x;
  if (obstacle.type === 'crate') {
    ctx.fillStyle = '#ff865f';
    ctx.fillRect(x, GROUND - 45, 50, 45);
    ctx.fillStyle = '#ffad79';
    ctx.fillRect(x + 5, GROUND - 40, 40, 35);
    ctx.strokeStyle = '#9b5246';
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(x + 7, GROUND - 7);
    ctx.lineTo(x + 43, GROUND - 39);
    ctx.moveTo(x + 43, GROUND - 7);
    ctx.lineTo(x + 7, GROUND - 39);
    ctx.stroke();
    ctx.fillStyle = '#ffe0a6';
    ctx.fillRect(x + 22, GROUND - 47, 7, 3);
  } else if (obstacle.type === 'drone') {
    const droneY = GROUND - 66 + Math.sin(elapsed * 5 + obstacle.phase) * 5;
    ctx.fillStyle = 'rgba(109, 227, 220, .18)';
    ctx.beginPath();
    ctx.ellipse(x + 28, droneY + 27, 38, 7, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#8da6a0';
    roundedRect(ctx, x + 7, droneY, 42, 25, 9);
    ctx.fill();
    ctx.fillStyle = '#ff865f';
    ctx.fillRect(x + 16, droneY + 9, 24, 5);
    ctx.fillStyle = '#a7f36b';
    ctx.fillRect(x, droneY + 5, 9, 3);
    ctx.fillRect(x + 47, droneY + 5, 9, 3);
    ctx.strokeStyle = 'rgba(167, 243, 107, .6)';
    ctx.beginPath();
    ctx.moveTo(x + 28, droneY + 26);
    ctx.lineTo(x + 28, droneY + 39);
    ctx.stroke();
  } else {
    ctx.fillStyle = '#ff865f';
    ctx.beginPath();
    ctx.moveTo(x, GROUND);
    ctx.lineTo(x + 25, GROUND - 39);
    ctx.lineTo(x + 50, GROUND);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = '#ffd18f';
    ctx.beginPath();
    ctx.moveTo(x + 18, GROUND - 11);
    ctx.lineTo(x + 25, GROUND - 26);
    ctx.lineTo(x + 32, GROUND - 11);
    ctx.closePath();
    ctx.fill();
  }
}

function drawOverlay(title, subtitle, accent) {
  ctx.fillStyle = 'rgba(11, 18, 21, .5)';
  ctx.fillRect(0, 0, WIDTH, HEIGHT);
  ctx.fillStyle = 'rgba(15, 24, 27, .94)';
  ctx.fillRect(258, 174, 444, 174);
  ctx.strokeStyle = 'rgba(167, 243, 107, .62)';
  ctx.lineWidth = 1;
  ctx.strokeRect(258.5, 174.5, 443, 173);
  ctx.fillStyle = accent;
  ctx.fillRect(258, 174, 4, 174);
  ctx.textAlign = 'center';
  ctx.fillStyle = '#a7f36b';
  ctx.font = '500 11px monospace';
  ctx.fillText('NEO CITY // AUTONOMOUS UNIT R-07', WIDTH / 2, 211);
  ctx.fillStyle = '#f0f3e8';
  ctx.font = '700 43px "Barlow Condensed", sans-serif';
  ctx.fillText(title, WIDTH / 2, 263);
  ctx.fillStyle = '#9caaa7';
  ctx.font = '12px monospace';
  ctx.fillText(subtitle, WIDTH / 2, 293);
  ctx.fillStyle = '#6de3dc';
  ctx.font = '500 10px monospace';
  ctx.fillText('SPACE / ↑ TO JUMP     ·     ↓ TO SLIDE', WIDTH / 2, 321);
  ctx.textAlign = 'left';
}

function draw() {
  drawBackground();
  for (const obstacle of obstacles) drawObstacle(obstacle);
  drawRobot();

  for (const particle of particles) {
    ctx.globalAlpha = Math.max(0, particle.life / .65);
    ctx.fillStyle = particle.color;
    ctx.fillRect(particle.x, particle.y, 4, 4);
  }
  ctx.globalAlpha = 1;

  if (state === 'ready') drawOverlay('READY TO RUN?', 'The city is unstable. Keep your circuits intact.', '#a7f36b');
  if (state === 'paused') drawOverlay('RUN PAUSED', 'Take a breath. The city can wait.', '#6de3dc');
  if (state === 'over') drawOverlay('SIGNAL LOST', `You made it ${formatScore(distance)} meters. Go one more?`, '#ff865f');
  if (flash > 0) {
    ctx.fillStyle = `rgba(255, 134, 95, ${flash * .8})`;
    ctx.fillRect(0, 0, WIDTH, HEIGHT);
  }
}

function frame(timestamp) {
  const delta = Math.min((timestamp - (lastTime || timestamp)) / 1000, .04);
  lastTime = timestamp;
  if (state === 'running') update(delta);
  draw();
  requestAnimationFrame(frame);
}

startButton.addEventListener('click', startGame);
pauseButton.addEventListener('click', togglePause);

window.addEventListener('keydown', event => {
  if (['Space', 'ArrowUp', 'ArrowDown'].includes(event.code)) event.preventDefault();
  if (event.code === 'Space' || event.code === 'ArrowUp' || event.code === 'KeyW') jump();
  if (event.code === 'ArrowDown' || event.code === 'KeyS') slideHeld = state === 'running';
  if (event.code === 'KeyP' || event.code === 'Escape') togglePause();
  if (event.code === 'Enter' && state !== 'running') startGame();
}, { passive: false });

window.addEventListener('keyup', event => {
  if (event.code === 'ArrowDown' || event.code === 'KeyS') slideHeld = false;
});

canvas.addEventListener('pointerdown', event => {
  event.preventDefault();
  const bounds = canvas.getBoundingClientRect();
  if (state === 'running' && event.pointerType === 'touch' && event.clientY > bounds.top + bounds.height * .68) {
    slideHeld = true;
    return;
  }
  jump();
});
canvas.addEventListener('pointerup', () => { slideHeld = false; });
canvas.addEventListener('pointercancel', () => { slideHeld = false; });
canvas.addEventListener('pointerleave', () => { slideHeld = false; });
canvas.addEventListener('contextmenu', event => event.preventDefault());

requestAnimationFrame(frame);