const LOADING_TIPS = [
  'Walk up to objects and click to interact',
  'Hold Shift while walking to run',
  'Press Space to dance',
  'Click the desk to open the desktop environment',
  'Try the arcade machine for a mini-game',
  'Use arrow keys to strafe left and right',
];

function getRandomTip() {
  return LOADING_TIPS[Math.floor(Math.random() * LOADING_TIPS.length)];
}

export const _showLoadingScreen = () => {
  let loadingScreen = document.getElementById('loading-screen');

  if (!loadingScreen) {
    loadingScreen = document.createElement('div');
    loadingScreen.id = 'loading-screen';

    // --- Animated brand logo ---
    const brand = document.createElement('div');
    brand.className = 'loading-brand';

    const brandName = document.createElement('div');
    brandName.className = 'loading-brand-name';
    brandName.innerHTML = 'Ananthu<span class="brand-accent">.dev</span>';

    const brandTagline = document.createElement('div');
    brandTagline.className = 'loading-brand-tagline';
    brandTagline.textContent = 'Interactive 3D Portfolio';

    brand.appendChild(brandName);
    brand.appendChild(brandTagline);

    // --- Loading container ---
    const container = document.createElement('div');
    container.className = 'loading-container';

    const title = document.createElement('div');
    title.className = 'loading-title';
    title.textContent = 'Building your world';

    const barTrack = document.createElement('div');
    barTrack.className = 'loading-bar-track';

    const bar = document.createElement('div');
    bar.id = 'loading-bar';

    const percentText = document.createElement('div');
    percentText.id = 'percent-text';
    percentText.textContent = '0%';

    const tip = document.createElement('div');
    tip.className = 'loading-tip';
    tip.id = 'loading-tip';
    tip.textContent = `💡 ${getRandomTip()}`;

    barTrack.appendChild(bar);

    container.appendChild(title);
    container.appendChild(barTrack);
    container.appendChild(percentText);
    container.appendChild(tip);

    loadingScreen.appendChild(brand);
    loadingScreen.appendChild(container);
    document.body.appendChild(loadingScreen);

    // Rotate tips
    setInterval(() => {
      const tipEl = document.getElementById('loading-tip');
      if (tipEl) {
        tipEl.style.opacity = '0';
        tipEl.style.transition = 'opacity 0.3s ease';
        setTimeout(() => {
          tipEl.textContent = `💡 ${getRandomTip()}`;
          tipEl.style.opacity = '1';
        }, 300);
      }
    }, 4000);
  }

  return loadingScreen;
};

export const _updateLoadingProgress = (progress) => {
  const loadingBar = document.getElementById('loading-bar');
  const percentText = document.getElementById('percent-text');

  if (loadingBar) {
    loadingBar.style.width = `${progress}%`;
  }

  if (percentText) {
    percentText.textContent = `${progress}%`;
  }
};

export const _hideLoadingScreen = () => {
  const loadingScreen = document.getElementById('loading-screen');
  if (loadingScreen) {
    loadingScreen.style.opacity = '0';
    loadingScreen.style.transition = 'opacity 0.8s ease-out';

    setTimeout(() => {
      loadingScreen.remove();

      // Show the controls HUD
      const hud = document.getElementById('controls-hud');
      if (hud) {
        hud.style.display = 'flex';
      }
    }, 800);
  }
};
