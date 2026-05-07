export function startSpaceShooterGame(windowStateManager) {
  if (document.getElementById('game-container')) {
    return;
  }

  const gameContainer = document.createElement('div');
  gameContainer.id = 'game-container';
  Object.assign(gameContainer.style, {
    position: 'fixed',
    top: '0',
    left: '0',
    width: '100%',
    height: '100%',
    backgroundColor: 'black',
    zIndex: '9999',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    opacity: '0',
    transition: 'opacity 0.3s ease-in-out',
  });

  const instructions = document.createElement('div');
  Object.assign(instructions.style, {
    position: 'fixed',
    top: '20px',
    left: '50%',
    transform: 'translateX(-50%)',
    color: 'white',
    fontSize: '16px',
    textAlign: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    padding: '10px 20px',
    borderRadius: '8px',
    fontFamily: "'Outfit', Arial, sans-serif",
  });
  const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)
    || (navigator.maxTouchPoints && navigator.maxTouchPoints > 2);

  instructions.innerHTML = isMobile ? `
    <div style="margin-bottom: 5px; font-size: 16px; color: #26fffd;">How to Play</div>
    <div style="font-size: 13px;">Drag left/right to move · Auto-fires bullets</div>
  ` : `
    <div style="margin-bottom: 5px; font-size: 18px; color: #26fffd;">How to Play</div>
    <div>Move: ← → or A/D keys | Shoot: Spacebar</div>
  `;
  gameContainer.appendChild(instructions);

  const canvas = document.createElement('canvas');
  canvas.id = 'gameCanvas';
  const ctx = canvas.getContext('2d');
  canvas.width = Math.min(window.innerWidth * (isMobile ? 0.95 : 0.8), 800);
  canvas.height = Math.min(window.innerHeight * (isMobile ? 0.85 : 0.8), 600);
  canvas.style.touchAction = 'none'; // Prevent browser gestures on canvas
  gameContainer.appendChild(canvas);

  // Close button
  const closeBtn = document.createElement('button');
  closeBtn.className = 'ui-close-btn';
  closeBtn.setAttribute('aria-label', 'Close game');

  closeBtn.addEventListener('click', closeGame);

  const scoreDisplay = document.createElement('div');
  Object.assign(scoreDisplay.style, {
    position: 'fixed',
    top: '20px',
    left: '20px',
    color: 'white',
    fontSize: '24px',
    fontFamily: "'Space Grotesk', monospace",
  });
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

    document.removeEventListener('keydown', movePlayer);
    document.removeEventListener('keyup', stopPlayerMovement);
    document.removeEventListener('keydown', handleShoot);
    document.addEventListener('keydown', movePlayer);
    document.addEventListener('keyup', stopPlayerMovement);
    document.addEventListener('keydown', handleShoot);

    // Remove any existing game-over overlay
    const existingOverlay = gameContainer.querySelector('.game-over-overlay');
    if (existingOverlay) {
      existingOverlay.remove();
    }

    // Setup touch controls for mobile
    if (isMobile) {
      setupTouchControls();
    }
  }

  // ===== Mobile Touch Controls =====
  let touchStartX = null;
  let autoShootInterval = null;

  function handleTouchStart(e) {
    e.preventDefault();
    const touch = e.touches[0];
    const rect = canvas.getBoundingClientRect();
    touchStartX = touch.clientX - rect.left;
  }

  function handleTouchMove(e) {
    e.preventDefault();
    if (touchStartX === null) return;
    const touch = e.touches[0];
    const rect = canvas.getBoundingClientRect();
    const touchX = touch.clientX - rect.left;
    const canvasRatio = canvas.width / rect.width;

    // Map touch position directly to player position
    const targetX = (touchX * canvasRatio) - player.width / 2;
    const dx = targetX - player.x;
    player.dx = Math.max(-player.speed * 2, Math.min(dx, player.speed * 2));
  }

  function handleTouchEnd(e) {
    e.preventDefault();
    touchStartX = null;
    player.dx = 0;
  }

  function setupTouchControls() {
    canvas.addEventListener('touchstart', handleTouchStart, { passive: false });
    canvas.addEventListener('touchmove', handleTouchMove, { passive: false });
    canvas.addEventListener('touchend', handleTouchEnd, { passive: false });
    canvas.addEventListener('touchcancel', handleTouchEnd, { passive: false });

    // Auto-shoot on mobile
    if (autoShootInterval) clearInterval(autoShootInterval);
    autoShootInterval = setInterval(() => {
      if (!gameOver) {
        const currentTime = Date.now();
        if (currentTime - lastBulletTime > BULLET_COOLDOWN) {
          createBullet();
          lastBulletTime = currentTime;
        }
      }
    }, 300);
  }

  function cleanupTouchControls() {
    canvas.removeEventListener('touchstart', handleTouchStart);
    canvas.removeEventListener('touchmove', handleTouchMove);
    canvas.removeEventListener('touchend', handleTouchEnd);
    canvas.removeEventListener('touchcancel', handleTouchEnd);
    if (autoShootInterval) {
      clearInterval(autoShootInterval);
      autoShootInterval = null;
    }
  }

  const stars = [];
  const NUM_STARS = 100;
  const STAR_SPEED = 1;

  function createStars() {
    stars.length = 0;
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
      ctx.fillStyle = `rgba(255, 255, 255, ${Math.random() * 0.3 + 0.7})`;
      ctx.beginPath();
      ctx.arc(star.x, star.y, star.size, 0, Math.PI * 2);
      ctx.fill();
    });
  }

  function updatePlayer() {
    if (
      player.x + player.dx >= 0 &&
      player.x + player.dx <= canvas.width - player.width
    ) {
      player.x += player.dx;
    }
  }

  function drawPlayer() {
    ctx.drawImage(
      images.player,
      player.x,
      player.y,
      player.width,
      player.height,
    );
  }

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

  function handleShoot(e) {
    if (e.key === ' ' || e.key === 'Spacebar') {
      e.preventDefault();
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

      if (enemy.y > canvas.height) {
        enemies.splice(i, 1);
        continue;
      }

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

  function showGameOverScreen() {
    // Remove event listeners to prevent further input
    document.removeEventListener('keydown', movePlayer);
    document.removeEventListener('keyup', stopPlayerMovement);
    document.removeEventListener('keydown', handleShoot);

    if (spawnIntervalId) {
      clearInterval(spawnIntervalId);
      spawnIntervalId = null;
    }

    const overlay = document.createElement('div');
    overlay.className = 'game-over-overlay';

    const title = document.createElement('div');
    title.className = 'game-over-title';
    title.textContent = 'Game Over';

    const scoreText = document.createElement('div');
    scoreText.className = 'game-over-score';
    scoreText.textContent = `Final Score: ${score}`;

    const buttons = document.createElement('div');
    buttons.className = 'game-over-buttons';

    const playAgainBtn = document.createElement('button');
    playAgainBtn.className = 'game-btn primary';
    playAgainBtn.textContent = 'Play Again';
    playAgainBtn.addEventListener('click', () => {
      overlay.remove();
      resetGame();
      startGame();
    });

    const exitBtn = document.createElement('button');
    exitBtn.className = 'game-btn secondary';
    exitBtn.textContent = 'Exit';
    exitBtn.addEventListener('click', () => {
      closeGame();
    });

    buttons.appendChild(playAgainBtn);
    buttons.appendChild(exitBtn);

    overlay.appendChild(title);
    overlay.appendChild(scoreText);
    overlay.appendChild(buttons);

    gameContainer.appendChild(overlay);
  }

  function gameLoop() {
    ctx.fillStyle = 'black';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    updateStars();
    drawStars();

    if (gameOver) {
      cancelAnimationFrame(animationFrameId);
      animationFrameId = null;
      showGameOverScreen();
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

  function startGame() {
    resetGame();
    createStars();
    spawnIntervalId = setInterval(() => {
      if (!gameOver) {
        createEnemy();
      }
    }, enemySpawnRate);

    animationFrameId = requestAnimationFrame(gameLoop);
  }

  function closeGame() {
    gameOver = true;

    document.removeEventListener('keydown', movePlayer);
    document.removeEventListener('keyup', stopPlayerMovement);
    document.removeEventListener('keydown', handleShoot);
    cleanupTouchControls();

    if (animationFrameId) {
      cancelAnimationFrame(animationFrameId);
      animationFrameId = null;
    }
    if (spawnIntervalId) {
      clearInterval(spawnIntervalId);
      spawnIntervalId = null;
    }

    gameContainer.style.opacity = '0';
    setTimeout(() => {
      if (document.body.contains(gameContainer)) {
        document.body.removeChild(gameContainer);
      }

      if (windowStateManager) {
        windowStateManager._onaAnotherWindow = false;
      }
    }, 300);
  }

  setTimeout(() => {
    gameContainer.style.opacity = '1';
  }, 10);
}
