// Maingame: setup, game loop, collisions, states

const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d");

let gameState = "start"; // start, playing, levelup, gameover
let score = 0;
let bgImg = new Image();
bgImg.src = "./assets/sprites/background.png";

// Initialize
initPlayer(canvas);
resetEnemies();
resetBullets();
resetXP();
resetPowerups();

let lastTime = performance.now();

function gameLoop(timestamp) {
  const dt = (timestamp - lastTime) / 16.67; // ~1 on 60fps
  lastTime = timestamp;

  const clampedDt = Math.min(dt, 5);

  hue = (hue + 3) % 360; // change the value before 360 to update the animation speed, update rainbow color

  updateGame(clampedDt);
  drawGame();
  requestAnimationFrame(gameLoop);
}

function updateGame(dt) {
  if (gameState === "start") {
    // Wait for confirm to start
    if (input.confirm) {
      input.confirm = false;
      gameState = "playing";
    }
  } else if (gameState === "playing") {
    updatePlayer(canvas, dt);

    if (canShoot()) {
      shoot();
    }

    updateBullets(dt);
    updateEnemies(canvas, dt);
    handleBulletEnemyCollisions();
    handleEnemyBottomOrPlayerHit();
  } else if (gameState === "levelup") {
    handlePowerupSelection();
  } else if (gameState === "gameover") {
    // Wait for confirm to restart
    if (input.confirm) {
      input.confirm = false;
      restartGame();
    }
  }
}

function handleBulletEnemyCollisions() {
  for (let bi = bullets.length - 1; bi >= 0; bi--) {
    const b = bullets[bi];
    for (let ei = enemies.length - 1; ei >= 0; ei--) {
      const e = enemies[ei];
      if (rectsOverlap(b, e)) {
        // remove enemy and add score/XP
        enemies.splice(ei, 1);
        score += 10;
        addXP(10); //add 10 XP per enemy hit

        // remove bullet if not piercing
        if (!piercing) {
          bullets.splice(bi, 1);
          break; // bullet is gone, stop checking other enemies
        }
      }
    }
  }
}

function checkSpawnCollision(e) {
  return enemies.some((f) => rectsOverlap(e, f));
}

function handleEnemyBottomOrPlayerHit() {
  for (let i = 0; i < enemies.length; i++) {
    const e = enemies[i];

    // if enemy reaches the bottom of the screen
    if (e.y + e.height >= canvas.height - 40) {
      gameOver();
      return;
    }
  }
}


function gameOver() {
  gameState = "gameover";

  // Send Score to react component
  window.parent.postMessage({
    type: 'GAME_OVER',
    score: score,
  }, '*');
}

function restartGame() {
  gameState = "playing";
  score = 0;
  resetEnemies();
  resetBullets();
  resetXP();
  resetPowerups();
  initPlayer(canvas);
  lastTime = performance.now();
}

function drawGame() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  //background image
  ctx.drawImage(bgImg, 0, 0, canvas.width, canvas.height);
  // player, enemies, bullets
  drawPlayer(ctx);
  drawEnemies(ctx);
  drawBullets(ctx);

  // HUD & XP-bar
  drawHUD(ctx, score);
  drawXPBar(ctx, canvas);

  // overlays
  if (gameState === "start") {
    drawStartScreen(ctx, canvas);
  } else if (gameState === "levelup") {
    drawLevelUpMenu(ctx, canvas);
  } else if (gameState === "gameover") {
    drawGameOver(ctx, canvas, score);
  }
}

// Start the loop
requestAnimationFrame(gameLoop);

