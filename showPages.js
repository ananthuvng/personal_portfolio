function unlockPointer() {
  if ('ontouchstart' in window) return;
  if (document.pointerLockElement) {
    document.exitPointerLock();
  }
  document.body.style.cursor = 'default';
  document.documentElement.style.cursor = 'default';
}

function lockPointer() {
  if ('ontouchstart' in window) return;
  const canvas = document.querySelector('canvas');
  if (canvas) {
    canvas.requestPointerLock();
  }
  document.body.style.cursor = '';
  document.documentElement.style.cursor = '';
}

export function sliderShow(windowStateManager, images, isAutoClose = false) {
  unlockPointer();
  const popup = document.createElement('div');
  let autoCloseTimer;
  popup.id = 'about-popup';
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

  const imageContainer = document.createElement('div');
  Object.assign(imageContainer.style, {
    position: 'relative',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    boxSizing: 'border-box', // Crucial to prevent padding from adding to width
    width: isMobile ? '90%' : '80%',
    height: isMobile ? '70vh' : '80vh',
    backgroundColor: 'rgba(10, 10, 20, 0.6)',
    borderRadius: isMobile ? '12px' : '16px',
    padding: isMobile ? '16px' : '2%', // fixed pixel padding on mobile is safer
    border: '1px solid rgba(255, 255, 255, 0.1)',
    backdropFilter: 'blur(20px)',
  });

  const sliderContainer = document.createElement('div');
  Object.assign(sliderContainer.style, {
    position: 'relative',
    overflow: 'hidden',
    width: '100%',
    height: '100%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  });

  const imageWrapper = document.createElement('div');
  Object.assign(imageWrapper.style, {
    display: 'flex',
    transition: 'transform 0.5s ease',
    width: '100%',
    height: '100%',
  });

  let currentImageIndex = 0;

  images.forEach((imgSrc, index) => {
    const imgContainer = document.createElement('div');
    Object.assign(imgContainer.style, {
      minWidth: '100%',
      height: '100%',
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      flexShrink: '0',
    });

    const img = document.createElement('img');
    img.src = imgSrc;
    Object.assign(img.style, {
      width: '100%',
      height: '100%',
      objectFit: 'contain',
      userSelect: 'none',
      pointerEvents: 'none', // helps prevent accidental drag on mobile
    });

    imgContainer.appendChild(img);
    imageWrapper.appendChild(imgContainer);
  });

  if (images.length > 1) {
    const createNavButton = (direction) => {
      const button = document.createElement('div');
      Object.assign(button.style, {
        position: 'absolute',
        top: '50%',
        transform: 'translateY(-50%)',
        backgroundColor: 'rgba(255, 255, 255, 0.1)',
        backdropFilter: 'blur(5px)',
        width: '4vw',
        height: '4vw',
        minWidth: '40px',
        minHeight: '40px',
        borderRadius: '50%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        cursor: 'pointer',
        transition: 'all 0.3s ease',
        color: 'white',
        fontSize: '1.5vw',
        fontWeight: 'bold',
        userSelect: 'none',
        zIndex: '2',
      });

      button.innerHTML = direction === 'prev' ? '<' : '>';
      button.style[direction === 'prev' ? 'left' : 'right'] = '2%';

      button.addEventListener('mouseenter', () => {
        button.style.backgroundColor = 'rgba(38, 255, 253, 0.8)';
        button.style.transform = 'translateY(-50%) scale(1.1)';
      });

      button.addEventListener('mouseleave', () => {
        button.style.backgroundColor = 'rgba(255, 255, 255, 0.1)';
        button.style.transform = 'translateY(-50%) scale(1)';
      });

      return button;
    };

    const prevButton = createNavButton('prev');
    const nextButton = createNavButton('next');

    prevButton.addEventListener('click', () => {
      if (currentImageIndex > 0) {
        currentImageIndex--;
      } else {
        currentImageIndex = images.length - 1;
      }
      imageWrapper.style.transform = `translateX(-${currentImageIndex * 100}%)`;
    });

    nextButton.addEventListener('click', () => {
      if (currentImageIndex < images.length - 1) {
        currentImageIndex++;
      } else {
        currentImageIndex = 0;
      }
      imageWrapper.style.transform = `translateX(-${currentImageIndex * 100}%)`;
    });

    imageContainer.appendChild(prevButton);
    imageContainer.appendChild(nextButton);

    // Swipe gesture support for mobile
    let touchStartXSwipe = null;
    imageContainer.addEventListener(
      'touchstart',
      (e) => {
        touchStartXSwipe = e.touches[0].clientX;
      },
      { passive: true },
    );

    imageContainer.addEventListener(
      'touchend',
      (e) => {
        if (touchStartXSwipe === null) return;
        const touchEndX = e.changedTouches[0].clientX;
        const diffX = touchStartXSwipe - touchEndX;
        const threshold = 50;

        if (Math.abs(diffX) > threshold) {
          if (diffX > 0) {
            // Swiped left — next
            currentImageIndex =
              currentImageIndex < images.length - 1 ? currentImageIndex + 1 : 0;
          } else {
            // Swiped right — prev
            currentImageIndex =
              currentImageIndex > 0 ? currentImageIndex - 1 : images.length - 1;
          }
          imageWrapper.style.transform = `translateX(-${currentImageIndex * 100}%)`;
        }
        touchStartXSwipe = null;
      },
      { passive: true },
    );
  }

  const closeButton = document.createElement('button');
  closeButton.className = 'ui-close-btn';
  closeButton.setAttribute('aria-label', 'Close');

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

  closeButton.addEventListener('click', () => {
    lockPointer();
    closePopup();
  });
  popup.addEventListener('click', (e) => {
    if (e.target === popup) {
      lockPointer();
      closePopup();
    }
  });

  sliderContainer.appendChild(imageWrapper);
  imageContainer.appendChild(sliderContainer);
  imageContainer.appendChild(closeButton);
  popup.appendChild(imageContainer);

  document.body.appendChild(popup);
  setTimeout(() => {
    popup.style.opacity = '1';

    if (isAutoClose) {
      setTimeout(() => {
        closePopup();
      }, 5000);
    }
  }, 10);
}
