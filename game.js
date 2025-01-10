export function startSpaceShooterGame(windowStateManager) {
  // Prevent multiple game instances
  if (document.getElementById('game-container')) {
    return;
  }

  // Create the game container
  const gameContainer = document.createElement('div');
  gameContainer.id = 'game-container';
  gameContainer.style.position = 'fixed';
  gameContainer.style.top = '0';
  gameContainer.style.left = '0';
  gameContainer.style.width = '100%';
  gameContainer.style.height = '100%';
  gameContainer.style.backgroundColor = 'black';
  gameContainer.style.zIndex = '9999';
  gameContainer.style.display = 'flex';
  gameContainer.style.alignItems = 'center';
  gameContainer.style.justifyContent = 'center';
  gameContainer.style.opacity = '0';
  gameContainer.style.transition = 'opacity 0.3s ease-in-out';

  // Create instructions panel
  const instructions = document.createElement('div');
  instructions.style.position = 'fixed';
  instructions.style.top = '20px';
  instructions.style.left = '50%';
  instructions.style.transform = 'translateX(-50%)';
  instructions.style.color = 'white';
  instructions.style.fontSize = '16px';
  instructions.style.textAlign = 'center';
  instructions.style.backgroundColor = 'rgba(0, 0, 0, 0.6)';
  instructions.style.padding = '10px 20px';
  instructions.style.borderRadius = '8px';
  instructions.style.fontFamily = 'Arial, sans-serif';
  instructions.innerHTML = `
    <div style="margin-bottom: 5px; font-size: 18px; color: #26fffd;">How to Play</div>
    <div>Move: ← → or A/D keys | Shoot: Spacebar</div>
  `;
  gameContainer.appendChild(instructions);

  // Create the canvas for the game
  const canvas = document.createElement('canvas');
  canvas.id = 'gameCanvas';
  const ctx = canvas.getContext('2d');
  canvas.width = Math.min(window.innerWidth * 0.8, 800); // Max width of 800
  canvas.height = Math.min(window.innerHeight * 0.8, 600); // Max height of 600
  gameContainer.appendChild(canvas);

  // Create the close button with new styling
  const closeBtn = document.createElement('div');
  Object.assign(closeBtn.style, {
    position: 'absolute',
    top: '2%',
    right: '2%',
    width: '3vw',
    height: '3vw',
    minWidth: '30px',
    minHeight: '30px',
    borderRadius: '50%',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    backdropFilter: 'blur(5px)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer',
    transition: 'all 0.3s ease',
    zIndex: '1000',
  });

  // Create the X icon using two lines
  const closeIcon = document.createElement('div');
  Object.assign(closeIcon.style, {
    position: 'relative',
    width: '50%',
    height: '50%',
  });

  const line1 = document.createElement('div');
  const line2 = document.createElement('div');
  const lineStyles = {
    position: 'absolute',
    width: '100%',
    height: '2px',
    backgroundColor: 'white',
    top: '50%',
    left: '0',
    transform: 'translateY(-50%)',
    transition: 'transform 0.3s ease',
  };

  Object.assign(line1.style, { ...lineStyles, transform: 'rotate(45deg)' });
  Object.assign(line2.style, { ...lineStyles, transform: 'rotate(-45deg)' });

  closeIcon.appendChild(line1);
  closeIcon.appendChild(line2);
  closeBtn.appendChild(closeIcon);

  closeBtn.addEventListener('mouseenter', () => {
    closeBtn.style.backgroundColor = 'rgba(38, 255, 253, 0.8)';
    closeBtn.style.transform = 'rotate(90deg)';
  });

  closeBtn.addEventListener('mouseleave', () => {
    closeBtn.style.backgroundColor = 'rgba(255, 255, 255, 0.1)';
    closeBtn.style.transform = 'rotate(0deg)';
  });

  // Close button functionality
  closeBtn.addEventListener('click', closeGame);

  function closeGame() {
    gameOver = true;

    // Remove all event listeners
    document.removeEventListener('keydown', movePlayer);
    document.removeEventListener('keyup', stopPlayerMovement);
    document.removeEventListener('keydown', handleShoot);

    // Cancel animation and intervals
    if (animationFrameId) {
      cancelAnimationFrame(animationFrameId);
    }
    if (spawnIntervalId) {
      clearInterval(spawnIntervalId);
    }

    // Fade out and remove game container
    gameContainer.style.opacity = '0';
    setTimeout(() => {
      document.body.removeChild(gameContainer);

      // Update window state if a state manager is provided
      if (windowStateManager) {
        windowStateManager._onaAnotherWindow = false;
      }
    }, 300);
  }

  const scoreDisplay = document.createElement('div');
  scoreDisplay.className = 'score';
  scoreDisplay.style.position = 'fixed';
  scoreDisplay.style.top = '20px';
  scoreDisplay.style.left = '20px';
  scoreDisplay.style.color = 'white';
  scoreDisplay.style.fontSize = '24px';
  scoreDisplay.innerText = 'Score: 0';
  gameContainer.appendChild(scoreDisplay);

  document.body.appendChild(gameContainer);
  gameContainer.appendChild(closeBtn);

  let score = 0;
  let gameOver = false;
  let animationFrameId = null;
  let spawnIntervalId = null;
  let lastBulletTime = 0;
  const BULLET_COOLDOWN = 250;

  const images = {
    player: new Image(),
    enemy: new Image(),
    bullet: new Image(),
  };

  images.player.src = './resources/images/shooter.png';
  images.enemy.src = './resources/images/enemy.png';
  images.bullet.src = './resources/images/bullet.png';

  const player = {
    x: canvas.width / 2 - 50,
    y: canvas.height - 100,
    width: 80,
    height: 80,
    speed: 5,
    dx: 0,
  };

  const bullets = [];
  const enemies = [];
  const enemySpeed = 3;
  const enemySpawnRate = 1000;

  let imagesLoaded = 0;
  const totalImages = Object.keys(images).length;

  function checkImagesLoaded() {
    imagesLoaded++;
    if (imagesLoaded === totalImages) {
      startGame();
    }
  }

  Object.values(images).forEach((img) => {
    img.addEventListener('load', checkImagesLoaded);
  });

  function resetGame() {
    score = 0;
    gameOver = false;
    player.x = canvas.width / 2 - 50;
    player.y = canvas.height - 100;
    player.dx = 0;
    bullets.length = 0;
    enemies.length = 0;
    scoreDisplay.innerText = 'Score: 0';

    // Clear any existing event listeners
    document.removeEventListener('keydown', movePlayer);
    document.removeEventListener('keyup', stopPlayerMovement);
    document.removeEventListener('keydown', handleShoot); // Remove right-click shoot listener

    // Add event listeners for the new game
    document.addEventListener('keydown', movePlayer);
    document.addEventListener('keyup', stopPlayerMovement);
    document.addEventListener('keydown', handleShoot); // Spacebar for shooting
  }

  const stars = [];
  const NUM_STARS = 100;
  const STAR_SPEED = 1;

  function createStars() {
    for (let i = 0; i < NUM_STARS; i++) {
      stars.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        size: Math.random() * 2,
        speed: Math.random() * STAR_SPEED + 0.5,
      });
    }
  }

  function updateStars() {
    stars.forEach((star) => {
      star.y += star.speed;
      if (star.y > canvas.height) {
        star.y = 0;
        star.x = Math.random() * canvas.width;
      }
    });
  }

  function drawStars() {
    stars.forEach((star) => {
      ctx.fillStyle = `rgba(255, 255, 255, ${Math.random() * 0.3 + 0.7})`; // Twinkle effect
      ctx.beginPath();
      ctx.arc(star.x, star.y, star.size, 0, Math.PI * 2);
      ctx.fill();
    });
  }

  // Update the player's position based on user input
  function updatePlayer() {
    if (
      player.x + player.dx >= 0 &&
      player.x + player.dx <= canvas.width - player.width
    ) {
      player.x += player.dx;
    }
  }

  // Draw the player's spaceship
  function drawPlayer() {
    ctx.drawImage(
      images.player,
      player.x,
      player.y,
      player.width,
      player.height,
    );
  }

  // Handle keyboard input for moving the player
  function movePlayer(e) {
    if (e.key === 'ArrowLeft' || e.key === 'a') {
      player.dx = -player.speed;
    } else if (e.key === 'ArrowRight' || e.key === 'd') {
      player.dx = player.speed;
    }
  }

  function stopPlayerMovement(e) {
    if (
      e.key === 'ArrowLeft' ||
      e.key === 'ArrowRight' ||
      e.key === 'a' ||
      e.key === 'd'
    ) {
      player.dx = 0;
    }
  }

  // Improved bullet creation with cooldown
  function handleShoot(e) {
    if (e.key === ' ' || e.key === 'Spacebar') {
      // Spacebar to shoot
      const currentTime = Date.now();
      if (currentTime - lastBulletTime > BULLET_COOLDOWN) {
        createBullet();
        lastBulletTime = currentTime;
      }
    }
  }

  function createBullet() {
    bullets.push({
      x: player.x + player.width / 2 - 15,
      y: player.y,
      width: 50,
      height: 50,
      speed: 7,
    });
  }

  function updateBullets() {
    for (let i = bullets.length - 1; i >= 0; i--) {
      bullets[i].y -= bullets[i].speed;
      if (bullets[i].y < 0) {
        bullets.splice(i, 1);
      }
    }
  }

  function drawBullets() {
    bullets.forEach((bullet) => {
      ctx.drawImage(
        images.bullet,
        bullet.x,
        bullet.y,
        bullet.width,
        bullet.height,
      );
    });
  }

  // Enemy object and functions
  function createEnemy() {
    const x = Math.random() * (canvas.width - 100);
    const enemy = {
      x: x,
      y: -100,
      width: 50,
      height: 50,
      speed: enemySpeed,
    };
    enemies.push(enemy);
  }

  function updateEnemies() {
    for (let i = enemies.length - 1; i >= 0; i--) {
      const enemy = enemies[i];
      enemy.y += enemy.speed;

      // Remove enemy if it goes off screen
      if (enemy.y > canvas.height) {
        enemies.splice(i, 1);
        continue;
      }

      // Check for collision with bullets
      for (let j = bullets.length - 1; j >= 0; j--) {
        const bullet = bullets[j];
        if (
          bullet.x < enemy.x + enemy.width &&
          bullet.x + bullet.width > enemy.x &&
          bullet.y < enemy.y + enemy.height &&
          bullet.y + bullet.height > enemy.y
        ) {
          enemies.splice(i, 1);
          bullets.splice(j, 1);
          score += 10;
          scoreDisplay.innerText = `Score: ${score}`;
          break;
        }
      }

      // Check for collision with the player
      if (
        enemy.x < player.x + player.width &&
        enemy.x + enemy.width > player.x &&
        enemy.y < player.y + player.height &&
        enemy.y + enemy.height > player.y
      ) {
        gameOver = true;
      }
    }
  }

  function drawEnemies() {
    enemies.forEach((enemy) => {
      ctx.drawImage(images.enemy, enemy.x, enemy.y, enemy.width, enemy.height);
    });
  }

  // Game loop
  function gameLoop() {
    // Clear the canvas with black background
    ctx.fillStyle = 'black';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    updateStars();
    drawStars();
    if (gameOver) {
      cancelAnimationFrame(animationFrameId);
      clearInterval(spawnIntervalId);

      const playAgain = confirm(
        `Game Over! Final Score: ${score}\nDo you want to play again?`,
      );
      if (playAgain) {
        resetGame();
        startGame();
      } else {
        closeGame();
      }
      return;
    }

    updatePlayer();
    updateBullets();
    updateEnemies();

    drawPlayer();
    drawBullets();
    drawEnemies();

    animationFrameId = requestAnimationFrame(gameLoop);
  }

  // Start the game
  function startGame() {
    // Reset and set up event listeners
    resetGame();
    createStars();
    // Spawn enemies at intervals
    spawnIntervalId = setInterval(() => {
      if (!gameOver) {
        createEnemy();
      }
    }, enemySpawnRate);

    // Start the game loop
    animationFrameId = requestAnimationFrame(gameLoop);
  }

  // Close button functionality
  closeBtn.addEventListener('click', closeGame);

  function closeGame() {
    gameOver = true;

    // Remove all event listeners
    document.removeEventListener('keydown', movePlayer);
    document.removeEventListener('keyup', stopPlayerMovement);
    document.removeEventListener('keydown', handleShoot);

    // Cancel animation and intervals
    if (animationFrameId) {
      cancelAnimationFrame(animationFrameId);
    }
    if (spawnIntervalId) {
      clearInterval(spawnIntervalId);
    }

    // Fade out and remove game container
    gameContainer.style.opacity = '0';
    setTimeout(() => {
      document.body.removeChild(gameContainer);

      // Update window state if a state manager is provided
      if (windowStateManager) {
        windowStateManager._onaAnotherWindow = false;
      }
    }, 300);
  }

  // Show the game container with a slight delay
  setTimeout(() => {
    gameContainer.style.opacity = '1';
  }, 10);
}
