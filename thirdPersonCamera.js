import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.118/build/three.module.js';

export class ThirdPersonCamera {
  constructor(params) {
    this._params = params;
    this._camera = params.camera;
    this._currentPosition = new THREE.Vector3();
    this._currentLookat = new THREE.Vector3();

    // Mouse-orbit angles (GTA-style)
    this._yaw = 0;       // horizontal angle around character
    this._pitch = 0.3;   // vertical angle (radians, slightly above)
    this._distance = 30; // distance from character

    this._mouseSensitivity = 0.003;
    this._pitchMin = -0.2;  // don't go below ground
    this._pitchMax = 1.2;   // don't go too high

    this._initMouseControls();
  }

  _initMouseControls() {
    // Desktop: pointer lock for mouse look
    const canvas = this._params.renderer?.domElement || document.querySelector('canvas');

    document.addEventListener('click', (e) => {
      // Only request pointer lock if clicking on the game canvas
      if (e.target.tagName === 'CANVAS' && !document.pointerLockElement) {
        e.target.requestPointerLock();
      }
    });

    document.addEventListener('mousemove', (e) => {
      if (document.pointerLockElement) {
        this._yaw -= e.movementX * this._mouseSensitivity;
        this._pitch -= e.movementY * this._mouseSensitivity;
        this._pitch = Math.max(this._pitchMin, Math.min(this._pitchMax, this._pitch));
      }
    });

    // Mobile: right-side touch drag for camera
    this._touchId = null;
    this._touchStartX = 0;
    this._touchStartY = 0;

    document.addEventListener('touchstart', (e) => {
      for (const touch of e.changedTouches) {
        // Only capture touches on the right half of screen (left half is joystick)
        if (touch.clientX > window.innerWidth * 0.4 && this._touchId === null) {
          // Don't capture if touching UI elements
          const el = document.elementFromPoint(touch.clientX, touch.clientY);
          if (el && (el.closest('#mobile-joystick') || el.closest('.popup-overlay') || 
              el.closest('.ui-close-btn') || el.id === 'enter-world-btn')) continue;
          
          this._touchId = touch.identifier;
          this._touchStartX = touch.clientX;
          this._touchStartY = touch.clientY;
        }
      }
    }, { passive: true });

    document.addEventListener('touchmove', (e) => {
      for (const touch of e.changedTouches) {
        if (touch.identifier === this._touchId) {
          const dx = touch.clientX - this._touchStartX;
          const dy = touch.clientY - this._touchStartY;
          this._yaw -= dx * 0.005;
          this._pitch -= dy * 0.005;
          this._pitch = Math.max(this._pitchMin, Math.min(this._pitchMax, this._pitch));
          this._touchStartX = touch.clientX;
          this._touchStartY = touch.clientY;
        }
      }
    }, { passive: true });

    document.addEventListener('touchend', (e) => {
      for (const touch of e.changedTouches) {
        if (touch.identifier === this._touchId) {
          this._touchId = null;
        }
      }
    }, { passive: true });
  }

  // Expose yaw so the character controller can align movement to camera direction
  get Yaw() {
    return this._yaw;
  }

  _CalculateIdealOffset() {
    const targetPos = this._params.target.Position;

    // Spherical coordinates around the character
    const x = this._distance * Math.sin(this._pitch) * Math.sin(this._yaw);
    const y = this._distance * Math.cos(this._pitch) + 10; // +10 to keep above ground
    const z = this._distance * Math.sin(this._pitch) * Math.cos(this._yaw);

    return new THREE.Vector3(
      targetPos.x + x,
      targetPos.y + y,
      targetPos.z + z,
    );
  }

  _CalculateIdealLookat() {
    const targetPos = this._params.target.Position;
    return new THREE.Vector3(targetPos.x, targetPos.y + 10, targetPos.z);
  }

  Update(timeElapsed) {
    const idealOffset = this._CalculateIdealOffset();
    const idealLookat = this._CalculateIdealLookat();
    const t = 1.0 - Math.pow(0.001, timeElapsed);

    this._currentPosition.lerp(idealOffset, t);
    this._currentLookat.lerp(idealLookat, t);

    this._camera.position.copy(this._currentPosition);
    this._camera.lookAt(this._currentLookat);
  }
}
