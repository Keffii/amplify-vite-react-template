// Power-ups and level up menu

let powerupPool = [
  "Double Bullets",
  "Piercing",
  "Faster Firerate",
  "Move Speed",
  "Wider Bullets"
];

let currentChoices = [];
let selectedIndex = 0;

// powerup states
let doubleShot = false;
let piercing = false;

function resetPowerups() {
  doubleShot = false;
  piercing = false;
}

function openLevelUpMenu() {
  gameState = "levelup";
  currentChoices = [];
  selectedIndex = 0;

  while (currentChoices.length < 3) {
    const p = powerupPool[Math.floor(Math.random() * powerupPool.length)];
    if (!currentChoices.includes(p)) currentChoices.push(p);
  }
}

function handlePowerupSelection() {
  // cycle option
  if (input.selectNext) {
    selectedIndex = (selectedIndex + 1) % currentChoices.length; // wrap around and move downwards
    input.selectNext = false;
  }

  if (input.selectPrevious) {
    selectedIndex = (selectedIndex - 1 + currentChoices.length) % currentChoices.length; // wrap around and move upwards
    input.selectPrevious = false;
  }

  // confirm choice
  if (input.confirm) {
    applyPowerup(currentChoices[selectedIndex]);
    input.confirm = false;
    gameState = "playing";
  }
}

function applyPowerup(p) {
  switch (p) {
    case "Double Bullets":
      doubleShot = true;
      //remove from powerup pool once chosen
      powerupPool = powerupPool.filter(p => p !== "Double Bullets")
      break;
    case "Piercing":
      piercing = true;
      //remove from powerup pool once chosen
      powerupPool = powerupPool.filter(p => p !== "Piercing");
      break;
    case "Faster Firerate":
      fireCooldown = Math.max(80, fireCooldown * 0.8);
      break;
    case "Move Speed":
      if (player) player.speed += 1;
      break;
    case "Wider Bullets":
    bulletHeight += 10;
    bulletWidth += 10;
    break;
  }
}
