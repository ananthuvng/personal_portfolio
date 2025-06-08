const DraggableUtil = {
  makeDraggable(element, container, onClick) {
    let isDragging = false;
    let currentX = parseInt(element.dataset.initialX) || 0;
    let currentY = parseInt(element.dataset.initialY) || 0;
    let startX;
    let startY;
    let initialClickX;
    let initialClickY;
    const dragThreshold = 5;

    const dragStart = (e) => {
      if (e.target !== element && e.target.parentElement !== element) return;
      e.preventDefault();

      initialClickX = e.clientX;
      initialClickY = e.clientY;
      startX = e.clientX - currentX;
      startY = e.clientY - currentY;

      element.style.transition = "none";

      document.addEventListener("mousemove", drag);
      document.addEventListener("mouseup", dragEnd);
    };

    const drag = (e) => {
      const deltaX = Math.abs(e.clientX - initialClickX);
      const deltaY = Math.abs(e.clientY - initialClickY);

      if (!isDragging && (deltaX > dragThreshold || deltaY > dragThreshold)) {
        isDragging = true;
        element.style.zIndex = "1000";
      }

      if (!isDragging) return;
      e.preventDefault();

      currentX = e.clientX - startX;
      currentY = e.clientY - startY;

      const bounds = container.getBoundingClientRect();
      const elementBounds = element.getBoundingClientRect();

      currentX = Math.max(
        0,
        Math.min(currentX, bounds.width - elementBounds.width)
      );
      currentY = Math.max(
        0,
        Math.min(currentY, bounds.height - elementBounds.height - 80)
      );

      element.style.transform = `translate(${currentX}px, ${currentY}px)`;
    };

    const dragEnd = (e) => {
      document.removeEventListener("mousemove", drag);
      document.removeEventListener("mouseup", dragEnd);

      element.style.transition = "transform 0.2s ease";
      element.style.zIndex = "1";

      if (!isDragging && onClick) {
        onClick(e);
      }

      if (isDragging) {
        element.dataset.initialX = currentX.toString();
        element.dataset.initialY = currentY.toString();
      }

      isDragging = false;
    };

    element.addEventListener("mousedown", dragStart);

    return () => {
      element.removeEventListener("mousedown", dragStart);
      document.removeEventListener("mousemove", drag);
      document.removeEventListener("mouseup", dragEnd);
    };
  },
};

class ModernTaskbar {
  constructor() {
    this.element = document.createElement("div");
    Object.assign(this.element.style, {
      position: "absolute",
      bottom: "0",
      left: "0",
      width: "100%",
      height: "50px",
      backgroundColor: "rgba(28, 28, 28, 0.95)",
      backdropFilter: "blur(10px)",
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
      padding: "0 15px",
      boxShadow: "0 -1px 10px rgba(0,0,0,0.2)",
      zIndex: "100",
    });

    this.leftSection = document.createElement("div");
    Object.assign(this.leftSection.style, {
      display: "flex",
      alignItems: "center",
      gap: "10px",
    });

    this.centerSection = document.createElement("div");
    Object.assign(this.centerSection.style, {
      position: "absolute",
      left: "50%",
      transform: "translateX(-50%)",
      display: "flex",
      alignItems: "center",
      gap: "8px",
      padding: "5px 15px",
      backgroundColor: "rgba(255, 255, 255, 0.1)",
      borderRadius: "20px",
      backdropFilter: "blur(20px)",
      marginBottom: "10px",
    });

    this.rightSection = document.createElement("div");
    Object.assign(this.rightSection.style, {
      display: "flex",
      alignItems: "center",
      paddingRight: "10px",
      marginRight: "5px",
      gap: "10px",
    });

    this.element.appendChild(this.leftSection);
    this.element.appendChild(this.centerSection);
    this.element.appendChild(this.rightSection);

    const desktopArea = document.querySelector("#desktop-area");
    if (desktopArea) {
      desktopArea.style.marginBottom = "50px";
    }
  }

  addSystemIcon(iconSrc, label, onClick) {
    const icon = this._createIcon(iconSrc, label, onClick);
    this.leftSection.appendChild(icon);
  }

  addDockIcon(iconSrc, label, onClick) {
    const icon = this._createIcon(iconSrc, label, onClick, true);
    this.centerSection.appendChild(icon);
  }

  addUtilityIcon(iconSrc, label, onClick) {
    const icon = this._createIcon(iconSrc, label, onClick);
    this.rightSection.appendChild(icon);
  }
  _createIcon(iconSrc, label, onClick, isDockIcon = false) {
    const iconWrapper = document.createElement("div");
    Object.assign(iconWrapper.style, {
      position: "relative",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      width: isDockIcon ? "40px" : "30px",
      height: isDockIcon ? "40px" : "30px",
      padding: "5px",
      borderRadius: "8px",
      cursor: "pointer",
      transition: "all 0.2s ease",
      marginRight: isDockIcon ? "0" : "5px",
    });

    const icon = document.createElement("img");
    Object.assign(icon.style, {
      width: "100%",
      height: "100%",
      transition: "transform 0.2s ease",
    });
    icon.src = iconSrc;

    this.rightSection.style.paddingRight = "10px";

    iconWrapper.addEventListener("mouseenter", () => {
      iconWrapper.style.backgroundColor = "rgba(255, 255, 255, 0.1)";
      if (isDockIcon) {
        icon.style.transform = "scale(1.2)";
      }
      tooltip.style.opacity = "1";
      tooltip.style.visibility = "visible";
    });

    iconWrapper.addEventListener("mouseleave", () => {
      iconWrapper.style.backgroundColor = "transparent";
      if (isDockIcon) {
        icon.style.transform = "scale(1)";
      }
      tooltip.style.opacity = "0";
      tooltip.style.visibility = "hidden";
    });

    iconWrapper.addEventListener("click", onClick);

    iconWrapper.appendChild(icon);
    return iconWrapper;
  }
}
class CloseButton {
  constructor(container, cleanup, windowStateManager) {
    this.element = document.createElement("div");
    Object.assign(this.element.style, {
      position: "absolute",
      top: "20px",
      right: "20px",
      width: "40px",
      height: "40px",
      borderRadius: "50%",
      backgroundColor: "rgba(255, 255, 255, 0.1)",
      backdropFilter: "blur(5px)",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      cursor: "pointer",
      transition: "all 0.3s ease",
      zIndex: "1000",
    });

    const closeIcon = document.createElement("div");
    Object.assign(closeIcon.style, {
      position: "relative",
      width: "20px",
      height: "20px",
    });

    const line1 = document.createElement("div");
    const line2 = document.createElement("div");
    const lineStyles = {
      position: "absolute",
      width: "100%",
      height: "2px",
      backgroundColor: "white",
      top: "50%",
      left: "0",
      transform: "translateY(-50%)",
      transition: "transform 0.3s ease",
    };

    Object.assign(line1.style, { ...lineStyles, transform: "rotate(45deg)" });
    Object.assign(line2.style, { ...lineStyles, transform: "rotate(-45deg)" });

    closeIcon.appendChild(line1);
    closeIcon.appendChild(line2);
    this.element.appendChild(closeIcon);

    let isClosing = false;

    this.element.addEventListener("mouseenter", () => {
      this.element.style.backgroundColor = "rgba(38, 255, 253, 0.8)";
      this.element.style.transform = "rotate(90deg)";
    });

    this.element.addEventListener("mouseleave", () => {
      this.element.style.backgroundColor = "rgba(255, 255, 255, 0.1)";
      this.element.style.transform = "rotate(0deg)";
    });

    this.element.addEventListener("click", () => {
      if (isClosing) return;
      isClosing = true;

      if (windowStateManager) {
        windowStateManager._onaAnotherWindow = false;
      }
      container.style.transform = "scale(0.8)";
      container.style.opacity = "0";

      setTimeout(() => {
        cleanup();
        document.body.removeChild(container);
      }, 300);
    });
  }
}

class DesktopIcon {
  constructor(options = {}) {
    this.element = document.createElement("div");
    Object.assign(this.element.style, {
      position: "absolute",
      width: "90px",
      height: "90px",
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
      cursor: "grab",
      transition: "transform 0.2s ease",
      borderRadius: "12px",
      padding: "8px",
    });

    this.element.dataset.initialX = options.x || "20";
    this.element.dataset.initialY = options.y || "20";
    this.element.style.transform = `translate(${this.element.dataset.initialX}px, ${this.element.dataset.initialY}px)`;

    this.iconContainer = document.createElement("div");
    Object.assign(this.iconContainer.style, {
      width: "50px",
      height: "50px",
      backgroundColor: "rgba(255, 255, 255, 0.1)",
      borderRadius: "10px",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      marginBottom: "8px",
      pointerEvents: "none",
    });

    this.icon = document.createElement("img");
    Object.assign(this.icon.style, {
      width: "30px",
      height: "30px",
      pointerEvents: "none",
    });
    this.icon.src = options.iconSrc || "";
    this.icon.draggable = false;

    this.label = document.createElement("span");
    Object.assign(this.label.style, {
      color: "white",
      fontSize: "13px",
      textAlign: "center",
      wordBreak: "break-word",
      maxWidth: "100%",
      pointerEvents: "none",
      textShadow: "0 1px 2px rgba(0,0,0,0.5)",
    });
    this.label.textContent = options.label || "";

    this.element.addEventListener("mouseenter", () => {
      if (!this.element.dataset.isDragging) {
        this.element.style.backgroundColor = "rgba(255, 255, 255, 0.1)";
      }
    });

    this.element.addEventListener("mouseleave", () => {
      this.element.style.backgroundColor = "transparent";
    });

    this.iconContainer.appendChild(this.icon);
    this.element.appendChild(this.iconContainer);
    this.element.appendChild(this.label);
  }

  mount(container, onClick) {
    container.appendChild(this.element);
    this.element.addEventListener("click", (e) => {
      if (!this.element.dataset.isDragging) {
        onClick(e);
      }
    });
    return DraggableUtil.makeDraggable(this.element, container);
  }
}

export function createModernDesktop(windowStateManager) {
  const existingDesktop = document.getElementById("modern-desktop");
  if (existingDesktop) {
    document.body.removeChild(existingDesktop);
  }

  const container = document.createElement("div");
  container.id = "modern-desktop";
  Object.assign(container.style, {
    position: "fixed",
    top: "0",
    left: "0",
    width: "100%",
    height: "100%",
    backgroundColor: "#1a1a1a",
    backgroundImage: "linear-gradient(135deg, #1a1a1a 0%, #363636 100%)",
    overflow: "hidden",
    opacity: "0",
    transform: "scale(1.1)",
    transition: "transform 0.3s ease, opacity 0.3s ease",
  });

  const desktopArea = document.createElement("div");
  desktopArea.id = "desktop-area";
  Object.assign(desktopArea.style, {
    position: "relative",
    width: "100%",
    height: "calc(100% - 50px)",
    padding: "20px",
  });

  const taskbar = new ModernTaskbar();

  const icons = [
    {
      iconSrc: "./resources/images/pdficon.png",
      label: "Resume",
      onClick: () => window.open("./resources/pdfs/Resume.pdf", "_blank"),
      desktop: true,
      dock: true,
    },
    {
      iconSrc: "./resources/images/github.png",
      label: "GitHub",
      onClick: () => window.open("https://github.com/ananthuvng", "_blank"),
      desktop: true,
      dock: true,
    },
    {
      iconSrc: "./resources/images/linkedin.png",
      label: "LinkedIn",
      onClick: () =>
        window.open("https://linkedin.com/in/ananthuvng", "_blank"),
      desktop: true,
      dock: true,
    },
    {
      iconSrc: "./resources/images/instagram.png",
      label: "Instagram",
      onClick: () => window.open("https://instagram.com/ananthuvng", "_blank"),
      desktop: true,
      dock: true,
    },
    {
      iconSrc: "./resources/images/email.png",
      label: "Contact",
      onClick: () => window.open("mailto:ananthuvngmkd@gmail.com"),
      desktop: true,
      dock: true,
    },
  ];

  const cleanupFunctions = icons
    .filter((icon) => icon.desktop)
    .map((iconData, index) => {
      const icon = new DesktopIcon({
        iconSrc: iconData.iconSrc,
        label: iconData.label,
        x: (index % 3) * 120 + 20,
        y: Math.floor(index / 3) * 120 + 20,
      });

      return icon.mount(desktopArea, iconData.onClick);
    });

  icons
    .filter((icon) => icon.dock)
    .forEach((iconData) => {
      taskbar.addDockIcon(iconData.iconSrc, iconData.label, iconData.onClick);
    });

  taskbar.addUtilityIcon("./resources/images/wifi.png", "WiFi", () => {});
  taskbar.addUtilityIcon("./resources/images/battery.png", "Battery", () => {});

  const closeButton = new CloseButton(
    container,
    () => {
      cleanupFunctions.forEach((cleanup) => cleanup());
    },
    windowStateManager
  );

  container.appendChild(desktopArea);
  container.appendChild(taskbar.element);
  container.appendChild(closeButton.element);
  document.body.appendChild(container);

  requestAnimationFrame(() => {
    container.style.opacity = "1";
    container.style.transform = "scale(1)";
  });

  return () => {
    cleanupFunctions.forEach((cleanup) => cleanup());
    if (document.body.contains(container)) {
      document.body.removeChild(container);
    }
  };
}
