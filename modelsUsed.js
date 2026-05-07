export function showCredits(
  windowStateManager,
  credits = [],
  isAutoClose = false,
) {
  const popup = document.createElement('div');
  let autoCloseTimer;
  popup.id = 'credits-popup';
  Object.assign(popup.style, {
    position: 'fixed',
    top: '0',
    left: '0',
    width: '100%',
    height: '100%',
    backgroundColor: 'rgba(0,0,0,0.7)',
    zIndex: '9999',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    opacity: '0',
    transition: 'opacity 0.3s ease-in-out',
  });

  const isMobile = window.innerWidth <= 768;

  const creditsContainer = document.createElement('div');
  Object.assign(creditsContainer.style, {
    position: 'relative',
    boxSizing: 'border-box',
    width: isMobile ? '92%' : '80%',
    maxWidth: '800px',
    maxHeight: '80vh',
    backgroundColor: 'rgba(20, 20, 30, 0.9)',
    borderRadius: isMobile ? '12px' : '16px',
    padding: isMobile ? '24px 20px' : '40px',
    color: 'white',
    fontFamily: "'Outfit', Arial, sans-serif",
    overflow: 'auto',
    border: '1px solid rgba(255, 255, 255, 0.1)',
    backdropFilter: 'blur(20px)',
    WebkitOverflowScrolling: 'touch', // Smooth scroll on iOS
  });

  const header = `
      <div style="
        font-size: 24px;
        font-weight: bold;
        margin-bottom: 30px;
        color: #ffffff;
      ">
        Models Used
      </div>
    `;

  const content = credits
    .map(
      (credit) => `
      <div style="margin: 20px 0; line-height: 1.6;">
        <a href="${credit.modelLink}" 
           target="_blank" 
           style="color: #26fffd; text-decoration: none; font-size: 18px;">
          ${credit.modelName}
        </a> 
        <span style="display: inline-block; margin: 0 5px;">-</span>
        by ${credit.author} is licensed under 
        <a href="${credit.licenseLink}" 
           target="_blank" 
           style="color: #26fffd; text-decoration: none;">
          ${credit.licenseName}
        </a>
      </div>
    `,
    )
    .join('');

  creditsContainer.innerHTML = header + content;

  const closeButton = document.createElement('button');
  closeButton.className = 'ui-close-btn';
  closeButton.setAttribute('aria-label', 'Close credits');

  const closePopup = () => {
    popup.style.opacity = '0';
    if (windowStateManager) {
      windowStateManager._onaAnotherWindow = false;
    }

    if (autoCloseTimer) {
      clearTimeout(autoCloseTimer);
    }
    setTimeout(() => {
      document.body.removeChild(popup);
    }, 300);
  };

  closeButton.addEventListener('click', closePopup);
  popup.addEventListener('click', (e) => {
    if (e.target === popup) closePopup();
  });

  creditsContainer.appendChild(closeButton);
  popup.appendChild(creditsContainer);
  document.body.appendChild(popup);

  setTimeout(() => {
    popup.style.opacity = '1';

    if (isAutoClose) {
      autoCloseTimer = setTimeout(() => {
        closePopup();
      }, 5000);
    }
  }, 10);
}
