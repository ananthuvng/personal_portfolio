export function sliderShow(windowStateManager, images, isAutoClose = false) {
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

  const imageContainer = document.createElement('div');
  Object.assign(imageContainer.style, {
    position: 'relative',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    width: '80%',
    height: '80vh',
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    borderRadius: '10px',
    padding: '2%',
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
      maxWidth: '100%',
      maxHeight: '100%',
      objectFit: 'contain',
      width: 'auto',
      height: 'auto',
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
  }

  const closeButton = document.createElement('div');
  Object.assign(closeButton.style, {
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
