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

  const creditsContainer = document.createElement('div');
  Object.assign(creditsContainer.style, {
    position: 'relative',
    width: '80%',
    maxWidth: '800px',
    maxHeight: '80vh',
    backgroundColor: '#313131',
    borderRadius: '10px',
    padding: '40px',
    color: 'white',
    fontFamily: 'Arial, sans-serif',
    overflow: 'auto',
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

  const closeButton = document.createElement('div');
  Object.assign(closeButton.style, {
    position: 'absolute',
    top: '4%',
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
  closeButton.appendChild(closeIcon);

  closeButton.addEventListener('mouseenter', () => {
    closeButton.style.backgroundColor = 'rgba(38, 255, 253, 0.8)';
    closeButton.style.transform = 'rotate(90deg)';
  });

  closeButton.addEventListener('mouseleave', () => {
    closeButton.style.backgroundColor = 'rgba(255, 255, 255, 0.1)';
    closeButton.style.transform = 'rotate(0deg)';
  });

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
