// Write UI-elements: XP-bar, level up-menu, game over, text

let hue = 0; // for level up menu color cycling

function drawXPBar(ctx, canvas) {
  const barHeight = 20;

  ctx.fillStyle = "#333";
  ctx.fillRect(0, canvas.height - barHeight, canvas.width, barHeight);

  const ratio = xpNeeded > 0 ? xp / xpNeeded : 0;
  ctx.fillStyle = "lime";
  ctx.fillRect(0, canvas.height - barHeight, canvas.width * ratio, barHeight);

  ctx.fillStyle = "white";
  ctx.font = "14px Arial";
  ctx.fillText(`Level ${level}`, 10, canvas.height - 5);
}

function drawLevelUpMenu(ctx, canvas) {
  const w = canvas.width - 400; //decrease to make width smaller
  const h = 260;
  const x = canvas.width / 2 - w / 2;
  const y = canvas.height / 2 - h / 2;

  ctx.fillStyle = "rgba(0,0,0,0.85)";
  ctx.fillRect(x, y, w, h);

  ctx.strokeStyle = "white";
  ctx.lineWidth = 2;
  ctx.strokeRect(x, y, w, h);

  ctx.fillStyle = "white";
  ctx.font = "24px Arial";
  ctx.fillText("LEVEL UP! Choose a power-up", x + 30, y + 40);

  ctx.font = "20px Arial";
  currentChoices.forEach((p, i) => {
    if (i === selectedIndex) ctx.fillStyle='hsl('+hue+', 100%, 50%)'; // rainbow color effect on the selected option
    else ctx.fillStyle = "white";

    ctx.fillText(p, x + 50, y + 90 + i * 40);
  });

  ctx.font = "14px Arial";
  ctx.fillStyle = "white";
  ctx.fillText("Use ←/→ to cycle, CONFIRM to select", x + 40, y + h - 30);
}

function drawStartScreen(ctx, canvas) {
  ctx.fillStyle = "rgba(0,0,0,0.7)";
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  ctx.fillStyle = "white";
  ctx.font = "48px Arial";
  ctx.textAlign = "center";
  ctx.fillText("SPACE SURVIVORS", canvas.width / 2, canvas.height / 2 - 40);

  ctx.font = "24px Arial";
  ctx.fillText("Press CONFIRM to start", canvas.width / 2, canvas.height / 2 + 20);
  ctx.textAlign = "start";
}

function drawGameOver(ctx, canvas, score) {
  ctx.fillStyle = "rgba(0,0,0,0.7)";
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  ctx.fillStyle = "white";
  ctx.font = "48px Arial";
  ctx.fillText("GAME OVER", canvas.width / 2 - 150, canvas.height / 2 - 20);

  ctx.font = "24px Arial";
  ctx.fillText(`Score: ${score}`, canvas.width / 2 - 60, canvas.height / 2 + 20);
  ctx.font = "18px Arial";
  ctx.fillText("Press CONFIRM to restart", canvas.width / 2 - 115, canvas.height / 2 + 60);
}

function drawHUD(ctx, score) {
  ctx.fillStyle = "white";
  ctx.font = "18px Arial";
  ctx.fillText(`Score: ${score}`, 10, 24);
}
