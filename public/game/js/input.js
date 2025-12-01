// Input-handling (keyboard, implement ESP32 later)

let input = {
  left: false,
  right: false,
  selectNext: false,  // used in powerup menu
  selectPrevious: false,  // used in powerup menu
  confirm: false      // used in powerup menu
};

window.addEventListener("keydown", e => {
  if (e.key === "ArrowLeft" || e.key === "a") input.left = true;
  if (e.key === "ArrowRight" || e.key === "d") input.right = true;

  // menu-controller
  if ((e.key === "ArrowDown" || e.key === "s") && !e.repeat) {
    input.selectNext = true;
  }
  if ((e.key === "ArrowUp" || e.key === "w") && !e.repeat) {
    input.selectPrevious = true;
  }
  if ((e.key === "Enter" || e.key === "e") && !e.repeat) {
    input.confirm = true;
  }

  // start or restart game
  if ((e.key === "r" || e.key === "R") && !e.repeat) {
    if (gameState === "gameover") {
      restartGame();
    }
  }
});

window.addEventListener("keyup", e => {
  if (e.key === "ArrowLeft" || e.key === "a") input.left = false;
  if (e.key === "ArrowRight" || e.key === "d") input.right = false;
  // selectNext & confirm clear in powerups.js after use
});

// ESP32 Button Input via postMessage
window.addEventListener("message", (event) => {
  if (event.data.type === "ESP32_BUTTON") {
    const { btn, action } = event.data;
    
    if (btn === "LEFT") {
      input.left = (action === "press" || action === "held");
      // Trigger selectNext using esp32 button for powerup menu navigation (on press only)
      if (action === "press") {
        input.selectPrevious = true;
      }
    } else if (btn === "RIGHT") {
      input.right = (action === "press" || action === "held");
      // Trigger selectNext using esp32 button for powerup menu navigation (on press only)
      if (action === "press") {
        input.selectNext = true;
      }
    } else if (btn === "CONFIRM") {
      if (action === "press") {
        input.confirm = true;
        // Restart game on CONFIRM press if in gameover state
        if (gameState === "gameover") {
          restartGame();
        }
      }
    }
  }
});
