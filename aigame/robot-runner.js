const GAME_WIDTH = 960;
const GAME_HEIGHT = 540;
const GROUND_Y = 438;
const TARGET_SCORE = 1000;
const BEST_SCORE_KEY = 'robot-runner-p5play-best';

let runnerSprite;
let obstacleSprites = [];
let enemySprites = [];
let projectileSprites = [];
let skyline = [];
let stars = [];
let gameState = 'title';
let elapsedTime = 0;
let currentScore = 0;
let bestScore = 0;
let worldSpeed = 300;
let obstacleTimer = 1;
let enemyTimer = 2.2;
let shotCooldown = 0;
let backgroundOffset = 0;
let defeatedEnemies = 0;

function setup() {
  const gameCanvas = new Canvas(GAME_WIDTH, GAME_HEIGHT);
  gameCanvas.id = 'robot-runner-canvas';
  gameCanvas.setAttribute('aria-label', 'Robot Runner. Use arrow keys to move and jump, and space to shoot.');
  document.getElementById('game-container').appendChild(gameCanvas);
  world.gravity.y = 0;
  frameRate(60);

  bestScore = readBestScore();
  runnerSprite = createGameSprite(150, GROUND_Y - 34, 42, 64);
  runnerSprite.gameVerticalSpeed = 0;
  runnerSprite.gameRunPhase = 0;
  runnerSprite.gameGrounded = true;
  runnerSprite.gameInvulnerable = 0;

  skyline = Array.from({ length: 19 }, (_, index) => ({
    x: index * 64,
    width: random(38, 62),
    height: random(70, 190),
    shade: random(18, 38)
  }));
  stars = Array.from({ length: 75 }, () => ({
    x: random(GAME_WIDTH),
    y: random(20, GROUND_Y - 150),
    size: random(1, 3),
    glow: random(0.25, 0.9)
  }));

  const jumpButton = document.getElementById('jump-button');
  const shootButton = document.getElementById('shoot-button');
  jumpButton.addEventListener('pointerdown', event => {
    event.preventDefault();
    jumpRunner();
  });
  shootButton.addEventListener('pointerdown', event => {
    event.preventDefault();
    fireProjectile();
  });
}

function createGameSprite(x, y, width, height) {
  const sprite = new Sprite(x, y, width, height, 'n');
  sprite.visible = false;
  return sprite;
}

function readBestScore() {
  try {
    return Number(localStorage.getItem(BEST_SCORE_KEY)) || 0;
  } catch {
    return 0;
  }
}

function saveBestScore(score) {
  try {
    localStorage.setItem(BEST_SCORE_KEY, String(score));
  } catch {
    // The game remains playable when browser storage is disabled.
  }
}

function draw() {
  const deltaSeconds = Math.min(deltaTime / 1000 || 0, 0.04);
  drawWorld();

  if (gameState === 'playing') {
    updateGame(deltaSeconds);
  }

  drawEntities();
  drawHud();

  if (gameState !== 'playing') drawStateOverlay();
}

function drawWorld() {
  background('#08121f');

  noStroke();
  for (const star of stars) {
    fill(183, 226, 255, star.glow * 210);
    circle(star.x, star.y, star.size);
  }

  fill('#10263c');
  circle(780, 118, 94);
  fill('#15314a');
  circle(780, 118, 72);
  fill('#08121f');
  circle(801, 104, 57);

  for (let index = 0; index < skyline.length; index++) {
    const building = skyline[index];
    let x = (building.x - backgroundOffset * (index % 2 ? 0.55 : 0.32)) % (GAME_WIDTH + 90);
    if (x < -90) x += GAME_WIDTH + 90;
    const top = GROUND_Y - building.height;

    fill(12, 27 + building.shade, 43 + building.shade);
    rect(x, top, building.width, building.height);
    fill(58, 205, 224, 90);
    rect(x + 8, top + 14, 3, 10);
    for (let windowY = top + 32; windowY < GROUND_Y - 12; windowY += 24) {
      fill(index % 3 === 0 ? '#3d879c' : '#294f6c');
      rect(x + 9, windowY, 8, 5);
      if (building.width > 48) rect(x + 26, windowY, 8, 5);
    }
  }

  fill('#122337');
  rect(0, GROUND_Y, GAME_WIDTH, GAME_HEIGHT - GROUND_Y);
  stroke('#71f6dc');
  strokeWeight(2);
  line(0, GROUND_Y, GAME_WIDTH, GROUND_Y);
  stroke('#1f6171');
  strokeWeight(1);
  for (let x = -40 - backgroundOffset; x < GAME_WIDTH; x += 64) {
    line(x, GROUND_Y + 1, x - 38, GAME_HEIGHT);
  }
  noStroke();

  if (gameState === 'playing') {
    backgroundOffset = (backgroundOffset + worldSpeed * (deltaTime / 1000) * 0.16) % 64;
  }
}

function updateGame(deltaSeconds) {
  elapsedTime += deltaSeconds;
  worldSpeed = Math.min(560, 300 + elapsedTime * 5);
  runnerSprite.gameRunPhase += deltaSeconds * (worldSpeed / 56);
  runnerSprite.gameInvulnerable = Math.max(0, runnerSprite.gameInvulnerable - deltaSeconds);

  const horizontalDirection = Number(keyIsDown(RIGHT_ARROW)) - Number(keyIsDown(LEFT_ARROW));
  runnerSprite.x = constrain(runnerSprite.x + horizontalDirection * 300 * deltaSeconds, 38, GAME_WIDTH - 38);

  if (!runnerSprite.gameGrounded) {
    runnerSprite.gameVerticalSpeed += 1550 * deltaSeconds;
    runnerSprite.y += runnerSprite.gameVerticalSpeed * deltaSeconds;
    if (runnerSprite.y >= GROUND_Y - runnerSprite.height / 2) {
      runnerSprite.y = GROUND_Y - runnerSprite.height / 2;
      runnerSprite.gameVerticalSpeed = 0;
      runnerSprite.gameGrounded = true;
    }
  }

  const isSliding = keyIsDown(DOWN_ARROW) && runnerSprite.gameGrounded;
  runnerSprite.gameSliding = isSliding;

  obstacleTimer -= deltaSeconds;
  enemyTimer -= deltaSeconds;
  shotCooldown = Math.max(0, shotCooldown - deltaSeconds);
  if (obstacleTimer <= 0) {
    spawnObstacle();
    obstacleTimer = max(0.9, random(1.3, 1.95) - elapsedTime * 0.006);
  }
  if (enemyTimer <= 0) {
    spawnEnemy();
    enemyTimer = random(2.4, 3.6);
  }

  moveSprites(obstacleSprites, worldSpeed, deltaSeconds);
  moveSprites(enemySprites, worldSpeed * 0.82, deltaSeconds);
  moveSprites(projectileSprites, -620, deltaSeconds);
  checkHits();

  currentScore = Math.floor(elapsedTime * 24 + defeatedEnemies * 35);
  if (currentScore >= TARGET_SCORE) endGame('won');
}

function moveSprites(sprites, speed, deltaSeconds) {
  for (const sprite of sprites) {
    sprite.x -= speed * deltaSeconds;
    if (sprite.gameKind === 'enemy') {
      sprite.gameHoverPhase += deltaSeconds * 3;
      sprite.y = sprite.gameBaseY + sin(sprite.gameHoverPhase) * 12;
    }
  }
  removeOffscreen(sprites);
}

function spawnObstacle() {
  const kind = random() < 0.55 ? 'barrier' : 'drone';
  const obstacle = kind === 'barrier'
    ? createGameSprite(GAME_WIDTH + 40, GROUND_Y - 23, 42, 46)
    : createGameSprite(GAME_WIDTH + 40, GROUND_Y - 68, 58, 32);
  obstacle.gameKind = kind;
  obstacleSprites.push(obstacle);
}

function spawnEnemy() {
  const enemy = createGameSprite(GAME_WIDTH + 45, random(GROUND_Y - 160, GROUND_Y - 105), 48, 38);
  enemy.gameKind = 'enemy';
  enemy.gameBaseY = enemy.y;
  enemy.gameHoverPhase = random(TWO_PI);
  enemy.gameDefeated = false;
  enemySprites.push(enemy);
}

function fireProjectile() {
  if (gameState === 'title' || gameState === 'lost' || gameState === 'won') {
    if (gameState !== 'title') startGame();
    return;
  }
  if (gameState !== 'playing' || shotCooldown > 0) return;

  const projectile = createGameSprite(runnerSprite.x + 34, runnerSprite.y - 6, 22, 8);
  projectile.gameKind = 'projectile';
  projectileSprites.push(projectile);
  shotCooldown = 0.3;
}

function jumpRunner() {
  if (gameState === 'title') {
    startGame();
    return;
  }
  if (gameState !== 'playing' || !runnerSprite.gameGrounded) return;
  runnerSprite.gameVerticalSpeed = -620;
  runnerSprite.gameGrounded = false;
}

function startGame() {
  clearSprites(obstacleSprites);
  clearSprites(enemySprites);
  clearSprites(projectileSprites);
  elapsedTime = 0;
  currentScore = 0;
  worldSpeed = 300;
  obstacleTimer = 1;
  enemyTimer = 2.2;
  shotCooldown = 0;
  defeatedEnemies = 0;
  runnerSprite.x = 150;
  runnerSprite.y = GROUND_Y - runnerSprite.height / 2;
  runnerSprite.gameVerticalSpeed = 0;
  runnerSprite.gameGrounded = true;
  runnerSprite.gameSliding = false;
  gameState = 'playing';
}

function clearSprites(sprites) {
  for (const sprite of sprites) sprite.remove();
  sprites.length = 0;
}

function removeOffscreen(sprites) {
  for (let index = sprites.length - 1; index >= 0; index--) {
    if (sprites[index].x < -70 || sprites[index].gameDefeated) {
      sprites[index].remove();
      sprites.splice(index, 1);
    }
  }
}

function checkHits() {
  const runnerBounds = getRunnerBounds();

  for (const obstacle of obstacleSprites) {
    const obstacleBounds = {
      left: obstacle.x - obstacle.width / 2 + 5,
      right: obstacle.x + obstacle.width / 2 - 5,
      top: obstacle.y - obstacle.height / 2 + 4,
      bottom: obstacle.y + obstacle.height / 2 - 3
    };
    if (boxesOverlap(runnerBounds, obstacleBounds)) {
      endGame('lost');
      return;
    }
  }

  for (const enemy of enemySprites) {
    if (enemy.gameDefeated) continue;
    const enemyBounds = {
      left: enemy.x - enemy.width / 2 + 4,
      right: enemy.x + enemy.width / 2 - 4,
      top: enemy.y - enemy.height / 2 + 4,
      bottom: enemy.y + enemy.height / 2 - 4
    };
    if (boxesOverlap(runnerBounds, enemyBounds)) {
      endGame('lost');
      return;
    }

    for (const projectile of projectileSprites) {
      if (boxesOverlap({
        left: projectile.x - projectile.width / 2,
        right: projectile.x + projectile.width / 2,
        top: projectile.y - projectile.height / 2,
        bottom: projectile.y + projectile.height / 2
      }, enemyBounds)) {
        enemy.gameDefeated = true;
        projectile.gameDefeated = true;
        defeatedEnemies++;
        break;
      }
    }
  }
}

function getRunnerBounds() {
  const sliding = runnerSprite.gameSliding;
  const height = sliding ? 34 : 54;
  const centerY = runnerSprite.gameGrounded
    ? GROUND_Y - height / 2
    : runnerSprite.y;
  return {
    left: runnerSprite.x - 16,
    right: runnerSprite.x + 16,
    top: centerY - height / 2,
    bottom: centerY + height / 2
  };
}

function boxesOverlap(first, second) {
  return first.left < second.right &&
    first.right > second.left &&
    first.top < second.bottom &&
    first.bottom > second.top;
}

function endGame(result) {
  if (gameState !== 'playing') return;
  gameState = result;
  if (currentScore > bestScore) {
    bestScore = currentScore;
    saveBestScore(bestScore);
  }
}

function drawEntities() {
  drawRunner();
  for (const obstacle of obstacleSprites) drawObstacle(obstacle);
  for (const enemy of enemySprites) {
    if (!enemy.gameDefeated) drawEnemy(enemy);
  }
  for (const projectile of projectileSprites) {
    if (projectile.gameDefeated) continue;
    noStroke();
    fill('#ffe66d');
    rectMode(CENTER);
    rect(projectile.x, projectile.y, projectile.width, projectile.height, 4);
    fill('#fff6ba');
    circle(projectile.x + 8, projectile.y, 5);
  }
  rectMode(CORNER);
}

function drawRunner() {
  const sliding = runnerSprite.gameSliding;
  const x = runnerSprite.x;
  const floor = GROUND_Y;
  const centerY = runnerSprite.gameGrounded ? floor - (sliding ? 21 : 34) : runnerSprite.y;
  const phase = runnerSprite.gameRunPhase;

  push();
  translate(x, centerY);
  noStroke();

  if (sliding) {
    fill('#51b7c8');
    rect(-24, -18, 42, 25, 7);
    fill('#9df5e5');
    rect(1, -28, 27, 24, 6);
    fill('#142c43');
    rect(9, -23, 14, 8, 3);
    fill('#71f6dc');
    circle(18, -19, 4);
    fill('#a9c5d0');
    rect(-23, 7, 23, 6, 3);
  } else {
    const legSwing = runnerSprite.gameGrounded ? sin(phase) * 8 : -3;
    fill('#162c42');
    rect(-10, 22, 10, 19 + legSwing, 4);
    rect(5, 22, 10, 19 - legSwing, 4);
    fill('#71f6dc');
    rect(-12, 32 + legSwing, 17, 7, 3);
    rect(4, 32 - legSwing, 17, 7, 3);

    fill('#48a9bd');
    rect(-18, -9, 36, 34, 8);
    fill('#9df5e5');
    rect(-16, -29, 32, 27, 7);
    fill('#15334b');
    rect(-10, -24, 20, 10, 4);
    fill('#ff7f87');
    circle(-5, -19, 4);
    circle(5, -19, 4);
    fill('#c9edf0');
    rect(-23, -5, 6, 20, 3);
    rect(17, -5, 6, 20, 3);
    fill('#ffb15e');
    rect(-5, -33, 10, 4, 2);
  }
  pop();
}

function drawObstacle(obstacle) {
  push();
  translate(obstacle.x, obstacle.y);
  rectMode(CENTER);
  noStroke();
  if (obstacle.gameKind === 'barrier') {
    fill('#e95d72');
    rect(0, 0, obstacle.width, obstacle.height, 5);
    fill('#ffbd69');
    rect(0, -6, obstacle.width - 12, 8, 3);
    fill('#662e54');
    rect(-10, 11, 6, 12, 2);
    rect(10, 11, 6, 12, 2);
  } else {
    fill('#ff9a59');
    rect(0, 0, obstacle.width, obstacle.height, 8);
    fill('#612f4c');
    rect(0, 1, 33, 15, 5);
    fill('#ffec87');
    circle(-8, 0, 5);
    circle(8, 0, 5);
    fill('#9a4f61');
    triangle(-22, -13, -35, -22, -18, -20);
    triangle(22, -13, 35, -22, 18, -20);
  }
  pop();
}

function drawEnemy(enemy) {
  push();
  translate(enemy.x, enemy.y);
  noStroke();
  fill('#a273ff');
  ellipse(0, 0, 38, 26);
  fill('#e7d5ff');
  ellipse(0, -2, 26, 19);
  fill('#422b76');
  circle(-6, -2, 5);
  circle(6, -2, 5);
  fill('#ff7fba');
  triangle(-13, 10, -22, 18, -8, 15);
  triangle(13, 10, 22, 18, 8, 15);
  pop();
}

function drawHud() {
  noStroke();
  fill('#eaf5ff');
  textAlign(LEFT, TOP);
  textSize(15);
  text(`SCORE  ${String(currentScore).padStart(4, '0')}`, 26, 22);
  fill('#71f6dc');
  text(`BEST  ${String(bestScore).padStart(4, '0')}`, 26, 44);

  if (gameState === 'playing') {
    fill('#9cb2c5');
    textAlign(RIGHT, TOP);
    text(`${Math.max(0, TARGET_SCORE - currentScore)} TO GOAL`, GAME_WIDTH - 26, 24);
  }
}

function drawStateOverlay() {
  noStroke();
  fill(3, 10, 19, 180);
  rect(0, 0, GAME_WIDTH, GAME_HEIGHT);
  textAlign(CENTER, CENTER);

  if (gameState === 'title') {
    fill('#71f6dc');
    textSize(46);
    textStyle(BOLD);
    text('ROBOT RUNNER', GAME_WIDTH / 2, 190);
    fill('#eaf5ff');
    textSize(19);
    textStyle(NORMAL);
    text('Dash through Neon City. Dodge hazards and blast drones.', GAME_WIDTH / 2, 245);
    fill('#ffe66d');
    textSize(17);
    text('PRESS ENTER OR TAP TO START', GAME_WIDTH / 2, 310);
    fill('#a6bfd1');
    textSize(14);
    text('Arrow keys move · ↑ jumps · ↓ slides · SPACE shoots', GAME_WIDTH / 2, 350);
  } else if (gameState === 'paused') {
    drawOverlayMessage('PAUSED', 'Press ESC or P to continue');
  } else if (gameState === 'won') {
    drawOverlayMessage('CITY CLEARED!', `You scored ${currentScore}. Press ENTER to run again.`);
  } else if (gameState === 'lost') {
    drawOverlayMessage('RUN OVER', `Score: ${currentScore}. Press ENTER to try again.`);
  }
  textStyle(NORMAL);
}

function drawOverlayMessage(title, subtitle) {
  fill('#71f6dc');
  textSize(42);
  textStyle(BOLD);
  text(title, GAME_WIDTH / 2, 235);
  fill('#eaf5ff');
  textSize(18);
  textStyle(NORMAL);
  text(subtitle, GAME_WIDTH / 2, 292);
}

function keyPressed() {
  if (keyCode === ENTER) {
    if (gameState !== 'playing') startGame();
    return false;
  }
  if (keyCode === ESCAPE || key === 'p' || key === 'P') {
    if (gameState === 'playing') gameState = 'paused';
    else if (gameState === 'paused') gameState = 'playing';
    return false;
  }
  if (keyCode === UP_ARROW || key === 'w' || key === 'W') {
    jumpRunner();
    return false;
  }
  if (key === ' ') {
    fireProjectile();
    return false;
  }
  return true;
}

function mousePressed() {
  if (gameState === 'title' || gameState === 'lost' || gameState === 'won') {
    startGame();
    return false;
  }
  return true;
}

function touchStarted() {
  if (gameState === 'title' || gameState === 'lost' || gameState === 'won') {
    startGame();
    return false;
  }
  return false;
}
