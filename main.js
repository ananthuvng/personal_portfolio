import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.118/build/three.module.js';
import { FBXLoader } from 'https://cdn.jsdelivr.net/npm/three@0.118.1/examples/jsm/loaders/FBXLoader.js';
import {
  _hideLoadingScreen,
  _showLoadingScreen,
  _updateLoadingProgress,
} from './loading.js';
import { sliderShow } from './showPages.js';
import { showAboutPage, showExperiencePage, showProjectsPage, showBlogPage } from './contentPages.js';
import { startSpaceShooterGame } from './game.js';
import {
  checkIntersection,
  createBox3,
  createBox3Debug,
  createPlane,
  findChildByName,
  isDescendantOf,
} from './utils.js';
import { fenceDefinitions, objectsDefinitions } from './const.js';
import { CharacterFSM } from './characterFSM.js';
import { ThirdPersonCamera } from './thirdPersonCamera.js';
import { createModernDesktop } from './osinterface.js';
import { showCredits } from './modelsUsed.js';
import { credits } from './credits.js';
import { CharacterInput } from './characterInput.js';

class BasicCharacterControllerProxy {
  constructor(animations) {
    this._animations = animations;
  }

  get animations() {
    return this._animations;
  }
}

// Mobile detection helper
const _isMobile = () => {
  return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)
    || (navigator.maxTouchPoints && navigator.maxTouchPoints > 2);
};

class BasicCharacterController {
  constructor(params) {
    this._Init(params);
  }

  _Init(params) {
    this._params = params;
    this._raycaster = new THREE.Raycaster();
    this._mouse = new THREE.Vector2();
    this._clickedObject = null;

    this._decceleration = new THREE.Vector3(-0.0005, -0.0001, -5.0);
    this._acceleration = new THREE.Vector3(1, 0.25, 100.0);
    this._velocity = new THREE.Vector3(0, 0, 0);
    this._position = new THREE.Vector3();
    this._setupAudio();
    this._animations = {};
    this._input = new CharacterInput();
    this._stateMachine = new CharacterFSM(
      new BasicCharacterControllerProxy(this._animations),
    );
    this._fence = fenceDefinitions.map((fence) => {
      const fencebox = createBox3(
        fence.width,
        fence.length,
        fence.height,
        fence.x,
        fence.y,
        fence.z,
        fence.angle,
      );
      return fencebox;
    });
    this._objects = objectsDefinitions.map((object) => {
      const objectBox = createBox3(
        object.width,
        object.length,
        object.height,
        object.x,
        object.y,
        object.z,
        object.angle,
        object.color,
      );
      this._params.scene.add(objectBox);
      return objectBox;
    });
    this._onaAnotherWindow = false;
    this._LoadModels();

    this._AddMouseClickListener();
  }

  _setupAudio() {
    this._audioListener = new THREE.AudioListener();
    this._params.camera.add(this._audioListener);
    this._walkingSound = new THREE.Audio(this._audioListener);
    const audioLoader = new THREE.AudioLoader();
    audioLoader.load('./resources/audio/walking.mp3', (buffer) => {
      this._walkingSound.setBuffer(buffer);
      this._walkingSound.setLoop(true);
      this._walkingSound.setVolume(0.5);
    });
  }

  _updateSound(state) {
    if (
      !this._walkingSound.isPlaying &&
      (state === 'walk' || state === 'run' || state === 'walkback')
    ) {
      this._walkingSound.play();
      this._walkingSound.setPlaybackRate(state === 'run' ? 1.8 : 1.0);
    } else if (
      this._walkingSound.isPlaying &&
      state !== 'walk' &&
      state !== 'run' &&
      state !== 'walkback'
    ) {
      this._walkingSound.stop();
    } else if (this._walkingSound.isPlaying) {
      this._walkingSound.setPlaybackRate(state === 'run' ? 1.8 : 1.0);
    }
  }

  _LoadModels() {
    _showLoadingScreen();
    this._manager = new THREE.LoadingManager(
      () => {
        _hideLoadingScreen();
        if (this._stateMachine) {
          this._stateMachine.SetState('idle');
        }
      },
      (url, itemsLoaded, itemsTotal) => {
        const progress = Math.round((itemsLoaded / itemsTotal) * 100);
        _updateLoadingProgress(progress);
      },
    );

    const loader = new FBXLoader(this._manager);
    loader.setPath('./resources/models/');
    loader.load('about.fbx', (fbx) => {
      fbx.traverse((c) => {
        c.castShadow = true;
        if (c.material) {
          c.material.transparent = true;
          c.material.opacity = 1.0;
        }
      });
      fbx.rotation.y = -Math.PI / 2;
      fbx.scale.setScalar(50);
      fbx.position.set(0, 15, -8);

      this._params.scene.add(fbx);

      this._about = fbx;
    });

    loader.load('table.fbx', (fbx) => {
      fbx.traverse((c) => {
        if (c.material) {
          c.material.transparent = true;
          c.material.opacity = 1.0;
        }
      });
      fbx.rotation.y = -Math.PI / 2;
      fbx.scale.setScalar(0.068);
      fbx.position.set(308, 0, 0);
      this._table = fbx;
      this._params.scene.add(fbx);
    });

    loader.load('project.fbx', (fbx) => {
      fbx.traverse((c) => {
        if (c.material) {
          c.material.transparent = true;
          c.material.opacity = 1.0;
        }
      });
      fbx.rotation.y = -Math.PI / 2;
      fbx.scale.setScalar(40);
      fbx.position.set(98, 15, -58);
      this._params.scene.add(fbx);
      this._project = fbx;
    });
    loader.load('blog.fbx', (fbx) => {
      fbx.traverse((c) => {
        if (c.material) {
          c.material.transparent = true;
          c.material.opacity = 1.0;
        }
      });
      fbx.rotation.y = -Math.PI / 2;
      fbx.scale.setScalar(40);
      fbx.position.set(98, 15, 43);
      this._params.scene.add(fbx);
      this._blog = fbx;
    });

    loader.load('experience.fbx', (fbx) => {
      fbx.traverse((c) => {
        if (c.material) {
          c.material.transparent = true;
          c.material.opacity = 1.0;
        }
      });
      fbx.rotation.y = Math.PI / 2;
      fbx.scale.setScalar(0.4);
      fbx.position.set(110, 10, 0);
      this._experience = fbx;
      this._params.scene.add(fbx);
    });

    loader.load('projector.fbx', (fbx) => {
      fbx.traverse((c) => {
        c.castShadow = true;
      });
      fbx.scale.setScalar(12);
      fbx.position.set(0, 18, 0);
      const prjrctor1 = fbx.clone();
      const prjrctor2 = fbx.clone();
      prjrctor2.position.set(98, 18, -50);
      prjrctor1.position.set(98, 18, 50);

      this._params.scene.add(prjrctor1);
      this._params.scene.add(prjrctor2);

      this._params.scene.add(fbx);
    });

    loader.load('instruction.fbx', (fbx) => {
      fbx.traverse((c) => {
        c.castShadow = true;
      });
      fbx.scale.setScalar(3);
      fbx.position.set(-75, 0, -5);
      this._instruction = fbx;
      this._params.scene.add(fbx);
    });
    loader.load('spacecablecar.fbx', (fbx) => {
      fbx.traverse((c) => {
        c.castShadow = true;
      });

      fbx.scale.setScalar(0.5);
      fbx.rotation.y = -Math.PI / 2;

      fbx.position.set(-600, 30, -200);
      this._params.scene.add(fbx);

      this._carfly = fbx;
    });
    loader.load('lounge.fbx', (fbx) => {
      fbx.traverse((c) => {
        c.castShadow = true;
      });

      this._gaming = findChildByName(
        fbx,
        'Bar_completo2ARCADE_Bar_completo2Mat_Arcade_SI_0',
      );

      this._credits = findChildByName(
        fbx,
        'Bar_completo2base_del_tacho_Bar_completo2Atlas2_0003',
      );
      this._push = findChildByName(
        fbx,
        'Bar_completo2base_del_tacho_Bar_completo2Atlas2_000',
      );

      fbx.scale.setScalar(0.4);
      fbx.position.set(-55, -2, 3);
      fbx.rotation.y = -Math.PI / 2;
      this._params.scene.add(fbx);
    });
    loader.load('entrance.fbx', (fbx) => {
      fbx.traverse((c) => {
        c.castShadow = true;
      });

      fbx.scale.setScalar(0.048);
      fbx.position.set(-17, -4, -155);
      this._params.scene.add(fbx);
    });

    // ===== DRIVABLE CAR =====
    loader.load('car.fbx', (fbx) => {
      fbx.traverse((c) => {
        c.castShadow = true;
        if (c.material) {
          c.material.transparent = true;
          c.material.opacity = 1.0;
        }
      });
      fbx.scale.setScalar(12.0);
      fbx.position.set(-15, 0, -180);
      fbx.rotation.y = -Math.PI / 2;
      this._car = fbx;
      this._params.scene.add(fbx);
    });
    loader.load('scififence.fbx', (fbx) => {
      fbx.traverse((c) => {
        c.castShadow = true;
        if (c.material) {
          c.material.transparent = true;
          c.material.opacity = 1.0;
        }
      });

      this._fences = [fbx];
      const positions = [
        { x: 105, z: -60, a: -Math.PI / 2 },
        { x: 105, z: -25, a: -Math.PI / 2 },
        { x: 105, z: 42.5, a: -Math.PI / 2 },
        { x: 105, z: 77.5, a: -Math.PI / 2 },

        { x: -105, z: -60, a: -Math.PI / 2 },
        { x: -105, z: -25, a: -Math.PI / 2 },
        { x: -105, z: 10, a: -Math.PI / 2 },
        { x: -105, z: 42.5, a: -Math.PI / 2 },
        { x: -105, z: 77.5, a: -Math.PI / 2 },

        { z: -86, x: -78, a: Math.PI },
        { z: -86, x: -43, a: Math.PI },

        { z: -86, x: 27, a: Math.PI },
        { z: -86, x: 62, a: Math.PI },
        { z: -86, x: 96.5, a: Math.PI },

        { z: 86, x: -78, a: Math.PI },
        { z: 86, x: -43, a: Math.PI },
        { z: 86, x: -8, a: Math.PI },
        { z: 86, x: 27, a: Math.PI },
        { z: 86, x: 62, a: Math.PI },
        { z: 86, x: 96.5, a: Math.PI },

        { z: 16.5, x: 131.5, a: Math.PI },
        { z: 16.5, x: 166.5, a: Math.PI },
        { z: 16.5, x: 201.5, a: Math.PI },
        { z: 16.5, x: 236.5, a: Math.PI },

        { z: -16.5, x: 131.5, a: Math.PI },
        { z: -16.5, x: 166.5, a: Math.PI },
        { z: -16.5, x: 201.5, a: Math.PI },
        { z: -16.5, x: 236.5, a: Math.PI },

        { x: 245, z: 42.5, a: -Math.PI / 2 },
        { x: 245, z: -26, a: -Math.PI / 2 },

        { x: 314.5, z: 42.5, a: -Math.PI / 2 },
        { x: 314.5, z: 8.5, a: -Math.PI / 2 },
        { x: 314.5, z: -26, a: -Math.PI / 2 },

        { z: -52, x: 271, a: Math.PI },
        { z: -52, x: 306, a: Math.PI },
        { z: 51, x: 271, a: Math.PI },
        { z: 51, x: 306, a: Math.PI },

        { z: -112, x: 1, a: Math.PI / 2 },
        { z: -147, x: 1, a: Math.PI / 2 },

        { z: -112, x: -34.5, a: Math.PI / 2 },
        { z: -147, x: -34.5, a: Math.PI / 2 },
      ];

      positions.forEach((pos) => {
        const fenceClone = fbx.clone();

        fenceClone.scale.setScalar(10);
        fenceClone.position.set(pos.x, 0, pos.z);
        fenceClone.rotation.y = pos.a;

        this._params.scene.add(fenceClone);
        this._fences.push(fenceClone);
      });
    });

    loader.load('ananthu.fbx', (fbx) => {
      fbx.scale.setScalar(0.1);
      fbx.traverse((c) => {
        c.castShadow = true;
        if (c.isMesh) {
          const oldMaterial = c.material;
          c.material = new THREE.MeshStandardMaterial({
            color: oldMaterial.color,
            map: oldMaterial.map,
            metalness: 0.1,
            roughness: 0.8,
            morphTargets: true,
            morphNormals: true,
            skinning: true,
          });
        }
      });
      fbx.position.set(-90, 0, 15);
      fbx.rotation.y = Math.PI / 2;

      this._target = fbx;
      this._params.scene.add(this._target);

      this._mixer = new THREE.AnimationMixer(this._target);

      this._manager = new THREE.LoadingManager();
      this._manager.onLoad = () => {
        this._stateMachine.SetState('idle');
      };

      const _OnLoad = (animName, anim) => {
        const clip = anim.animations[0];
        const action = this._mixer.clipAction(clip);

        this._animations[animName] = {
          clip: clip,
          action: action,
        };
      };

      const loader = new FBXLoader(this._manager);
      loader.setPath('./resources/models/');
      loader.load('walking.fbx', (a) => {
        _OnLoad('walk', a);
      });
      loader.load('running.fbx', (a) => {
        _OnLoad('run', a);
      });
      loader.load('breathing.fbx', (a) => {
        _OnLoad('idle', a);
      });
      loader.load('dancing.fbx', (a) => {
        _OnLoad('dance', a);
      });
      loader.load('walkingback.fbx', (a) => {
        _OnLoad('walkback', a);
      });
      loader.load('walkleft.fbx', (a) => {
        _OnLoad('walkleft', a);
      });
      loader.load('walkright.fbx', (a) => {
        _OnLoad('walkright', a);
      });
    });
    // Instruction popup is no longer auto-shown — users get the HUD controls overlay instead

    // ===== PROXIMITY INTERACTION SYSTEM =====
    this._interactables = [];
    this._nearestInteractable = null;
    this._interactPrompt = document.getElementById('interaction-prompt');

    // ===== DRIVING STATE =====
    this._isDriving = false;
    this._carSpeed = 0;
    this._carSteer = 0;

    // F key to interact / enter-exit car
    document.addEventListener('keydown', (e) => {
      if (e.code === 'KeyF') {
        // If currently driving, exit the car
        if (this._isDriving) {
          this._ExitCar();
          return;
        }
        // If near an interactable and not in a window
        if (this._nearestInteractable && !this._onaAnotherWindow) {
          if (this._nearestInteractable.isCar) {
            this._EnterCar();
          } else {
            this._TriggerInteraction(this._nearestInteractable);
          }
        }
      }
    });
  }

  _GetInteractables() {
    // Generate the list of interactables dynamically so async loaded objects are included
    return [
      { obj: this._about, label: 'About', range: 45, action: () => showAboutPage(this) },
      { obj: this._experience, label: 'Experience', range: 45, action: () => showExperiencePage(this) },
      { obj: this._project, label: 'Projects', range: 45, action: () => showProjectsPage(this) },
      { obj: this._blog, label: 'Blog', range: 45, action: () => showBlogPage(this) },
      { obj: this._table, label: 'Desktop', range: 40, action: () => createModernDesktop(this) },
      { obj: this._gaming, label: 'Arcade', range: 30, action: () => startSpaceShooterGame(this) },
      { obj: this._credits, label: 'Credits', range: 30, action: () => showCredits(this, credits) },
      { obj: this._instruction, label: 'Instructions', range: 30, action: () => sliderShow(this, ['./resources/images/instruction.png']) },
      { obj: this._car, label: 'Enter Car', range: 50, isCar: true },
    ].filter(i => i.obj); // only include loaded objects
  }

  _EnterCar() {
    if (!this._car || !this._target) return;
    this._isDriving = true;
    this._carSpeed = 0;
    this._carSteer = 0;
    // Hide the character
    this._target.visible = false;
    // Stop walking sound
    if (this._walkingSound && this._walkingSound.isPlaying) {
      this._walkingSound.stop();
    }
    // Show driving hint
    if (this._interactPrompt) {
      const isMobile = 'ontouchstart' in window;
      this._interactPrompt.textContent = isMobile ? 'Tap to exit car' : 'Press F to exit · WASD to drive';
      this._interactPrompt.style.display = 'block';
    }
  }

  _ExitCar() {
    if (!this._car || !this._target) return;
    this._isDriving = false;
    this._carSpeed = 0;
    // Place character beside the car
    const carPos = this._car.position.clone();
    const exitOffset = new THREE.Vector3(18, 0, 0);
    exitOffset.applyQuaternion(this._car.quaternion);
    this._target.position.copy(carPos.add(exitOffset));
    this._target.visible = true;
    this._position.copy(this._target.position);
    if (this._interactPrompt) {
      this._interactPrompt.style.display = 'none';
    }
  }

  _UpdateDriving(timeInSeconds) {
    if (!this._isDriving || !this._car) return;

    const input = this._input;
    const maxSpeed = 300;
    const acceleration = 180;
    const brakeForce = 200;
    const friction = 35;
    const steerSpeed = 3.2;

    // Acceleration / braking
    if (input._keys.forward) {
      this._carSpeed += acceleration * timeInSeconds;
    } else if (input._keys.backward) {
      this._carSpeed -= brakeForce * timeInSeconds;
    } else {
      // Natural friction
      if (Math.abs(this._carSpeed) < friction * timeInSeconds) {
        this._carSpeed = 0;
      } else {
        this._carSpeed -= Math.sign(this._carSpeed) * friction * timeInSeconds;
      }
    }

    // Clamp speed
    this._carSpeed = Math.max(-maxSpeed * 0.4, Math.min(maxSpeed, this._carSpeed));

    // Steering (only when moving)
    if (Math.abs(this._carSpeed) > 1) {
      if (input._keys.left) {
        this._car.rotation.y -= steerSpeed * timeInSeconds * Math.sign(this._carSpeed);
      }
      if (input._keys.right) {
        this._car.rotation.y += steerSpeed * timeInSeconds * Math.sign(this._carSpeed);
      }
    }

    const oldCarPos = this._car.position.clone();

    // Move car forward in its facing direction
    const carForward = new THREE.Vector3(0, 0, -1);
    carForward.applyQuaternion(this._car.quaternion);
    carForward.multiplyScalar(this._carSpeed * timeInSeconds);
    this._car.position.add(carForward);

    // Car Collision Detection
    const carBoxSize = 25;
    const carBBox = new THREE.Box3(
      new THREE.Vector3(this._car.position.x - carBoxSize / 2, -10, this._car.position.z - carBoxSize / 2),
      new THREE.Vector3(this._car.position.x + carBoxSize / 2, 20, this._car.position.z + carBoxSize / 2)
    );
    const colliders = [...this._fence, ...this._objects];
    if (colliders.some((c) => c.intersectsBox(carBBox))) {
      this._car.position.copy(oldCarPos);
      this._carSpeed = 0;
    }

    // Keep character position synced so camera follows the car
    this._position.copy(this._car.position);
    this._target.position.copy(this._car.position);
  }

  _TriggerInteraction(interactable) {
    this._onaAnotherWindow = true;
    interactable.action();
  }

  _CheckProximity() {
    if (!this._target || this._onaAnotherWindow || this._isDriving) {
      if (this._interactPrompt && !this._isDriving) this._interactPrompt.style.display = 'none';
      return;
    }

    const interactables = this._GetInteractables();

    const playerPos = this._target.position;
    let nearest = null;
    let nearestDist = Infinity;

    for (const item of interactables) {
      if (!item.obj) continue;
      const objPos = new THREE.Vector3();
      item.obj.getWorldPosition(objPos);
      const dist = playerPos.distanceTo(objPos);
      if (dist < item.range && dist < nearestDist) {
        nearest = item;
        nearestDist = dist;
      }
    }

    this._nearestInteractable = nearest;

    if (this._interactPrompt) {
      if (nearest) {
        const isMobile = 'ontouchstart' in window;
        this._interactPrompt.textContent = isMobile
          ? `Tap to open ${nearest.label}`
          : `Press F — ${nearest.label}`;
        this._interactPrompt.style.display = 'block';
      } else {
        this._interactPrompt.style.display = 'none';
      }
    }
  }

  _AddMouseClickListener() {
    window.addEventListener(
      'click',
      (event) => {
        // If pointer is locked, raycast from center crosshair
        if (document.pointerLockElement) {
          this._OnMouseClick({
            clientX: window.innerWidth / 2,
            clientY: window.innerHeight / 2,
          });
        } else {
          this._OnMouseClick(event);
        }
      },
      false,
    );

    // Touch support — tap directly on 3D objects
    window.addEventListener(
      'touchend',
      (event) => {
        // Ignore touches on UI elements (joystick, overlays, etc.)
        const target = event.target;
        if (target.closest('#mobile-joystick') ||
          target.closest('.popup-overlay') ||
          target.closest('.ui-close-btn') ||
          target.closest('#welcome-screen') ||
          target.closest('#loading-screen')) return;

        if (event.changedTouches.length > 0) {
          const touch = event.changedTouches[0];
          this._OnMouseClick({
            clientX: touch.clientX,
            clientY: touch.clientY,
          });
        }
      },
      false,
    );
  }

  _OnMouseClick(event) {
    this._mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
    this._mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

    this._raycaster.setFromCamera(this._mouse, this._params.camera);
    const intersects = this._raycaster.intersectObjects(
      this._params.scene.children,
      true,
    );

    if (intersects.length > 0 && !this._onaAnotherWindow) {
      const isAboutClicked = intersects.some((intersect) =>
        isDescendantOf(intersect.object, this._about),
      );

      const isGamingClicked = intersects.some((intersect) =>
        isDescendantOf(intersect.object, this._gaming),
      );
      const isCreditsClicked = intersects.some((intersect) =>
        isDescendantOf(intersect.object, this._credits),
      );

      const isExperienceClicked = intersects.some((intersect) =>
        isDescendantOf(intersect.object, this._experience),
      );

      const isBlogClicked = intersects.some((intersect) =>
        isDescendantOf(intersect.object, this._blog),
      );
      const isProjectClicked = intersects.some((intersect) =>
        isDescendantOf(intersect.object, this._project),
      );

      const isTableClicked = intersects.some((intersect) =>
        isDescendantOf(intersect.object, this._table),
      );
      const isInstructionClicked = intersects.some((intersect) =>
        isDescendantOf(intersect.object, this._instruction),
      );
      if (isAboutClicked) {
        this._onaAnotherWindow = true;
        showAboutPage(this);
      } else if (isTableClicked) {
        this._onaAnotherWindow = true;
        createModernDesktop(this);
      } else if (isCreditsClicked) {
        this._onaAnotherWindow = true;
        showCredits(this, credits);
      } else if (isBlogClicked) {
        this._onaAnotherWindow = true;
        showBlogPage(this);
      } else if (isGamingClicked) {
        this._onaAnotherWindow = true;
        startSpaceShooterGame(this);
      } else if (isExperienceClicked) {
        this._onaAnotherWindow = true;
        showExperiencePage(this);
      } else if (isProjectClicked) {
        this._onaAnotherWindow = true;
        showProjectsPage(this);
      } else if (isInstructionClicked) {
        this._onaAnotherWindow = true;
        sliderShow(this, ['./resources/images/instruction.png']);
      }
    }
  }

  get Position() {
    return this._position;
  }

  get Rotation() {
    if (this._isDriving && this._car) {
      return this._car.quaternion;
    }
    if (!this._target) {
      return new THREE.Quaternion();
    }
    return this._target.quaternion;
  }

  Update(timeInSeconds) {
    // ===== DRIVING MODE =====
    if (this._isDriving) {
      this._UpdateDriving(timeInSeconds);
      return;
    }

    if (!this._stateMachine._currentState || this._onaAnotherWindow) {
      if (this._walkingSound && this._walkingSound.isPlaying) {
        this._walkingSound.stop();
      }
      return;
    }
    const velocity = this._velocity;
    const frameDecceleration = new THREE.Vector3(
      velocity.x * this._decceleration.x,
      velocity.y * this._decceleration.y,
      velocity.z * this._decceleration.z,
    );
    frameDecceleration.multiplyScalar(timeInSeconds);
    frameDecceleration.z =
      Math.sign(frameDecceleration.z) *
      Math.min(Math.abs(frameDecceleration.z), Math.abs(velocity.z));

    velocity.add(frameDecceleration);

    this._stateMachine.Update(timeInSeconds, this._input);

    const controlObject = this._target;
    const _Q = new THREE.Quaternion();
    const _A = new THREE.Vector3();
    const _R = controlObject.quaternion.clone();

    const acc = this._acceleration.clone();
    if (this._input._keys.shift) {
      acc.multiplyScalar(2.0);
    }

    if (this._stateMachine._currentState.Name == 'dance') {
      acc.multiplyScalar(0.0);
    }
    if (this._walkingSound && this._stateMachine._currentState) {
      this._updateSound(this._stateMachine._currentState.Name);
    }

    // Apply input to velocity (no collision gating here — we validate after moving)
    if (
      !this._input._keys.left &&
      !this._input._keys.right &&
      !this._input._keys.moveLeft &&
      !this._input._keys.moveRight
    ) {
      velocity.x = 0;
    }

    if (this._input._keys.forward) {
      velocity.z += acc.z * timeInSeconds;
    }
    if (this._input._keys.backward) {
      velocity.z -= acc.z * timeInSeconds;
    }
    // A/D and arrow keys both strafe now (rotation is mouse/touch controlled)
    if (this._input._keys.moveRight || this._input._keys.right) {
      velocity.x -= acc.x * timeInSeconds * 2;
    }
    if (this._input._keys.moveLeft || this._input._keys.left) {
      velocity.x += acc.x * timeInSeconds * 2;
    }

    // Get camera yaw for camera-relative movement
    const cameraYaw = this._thirdPersonCamera ? this._thirdPersonCamera.Yaw : 0;

    // Build movement direction relative to camera
    // Camera sits at (sin(yaw), y, cos(yaw)) from the character,
    // so "into the screen" (away from camera) is the negated direction
    const forward = new THREE.Vector3(0, 0, -1);
    const cameraQuat = new THREE.Quaternion();
    cameraQuat.setFromAxisAngle(new THREE.Vector3(0, 1, 0), cameraYaw);
    forward.applyQuaternion(cameraQuat);
    forward.normalize();

    const sideways = new THREE.Vector3(-1, 0, 0);
    sideways.applyQuaternion(cameraQuat);
    sideways.normalize();

    // Rotate character to face the right direction
    const isMovingForwardBack = this._input._keys.forward || this._input._keys.backward;
    const isStrafing = this._input._keys.left || this._input._keys.right ||
      this._input._keys.moveLeft || this._input._keys.moveRight;

    if (isMovingForwardBack) {
      // When moving forward/backward, face the movement direction (GTA-style)
      let moveDir = new THREE.Vector3(0, 0, 0);
      if (this._input._keys.forward) moveDir.add(forward);
      if (this._input._keys.backward) moveDir.sub(forward);
      if (this._input._keys.moveLeft || this._input._keys.left) moveDir.add(sideways);
      if (this._input._keys.moveRight || this._input._keys.right) moveDir.sub(sideways);

      if (moveDir.lengthSq() > 0.001) {
        moveDir.normalize();
        const targetAngle = Math.atan2(moveDir.x, moveDir.z);
        const targetQuat = new THREE.Quaternion();
        targetQuat.setFromAxisAngle(new THREE.Vector3(0, 1, 0), targetAngle);
        controlObject.quaternion.slerp(targetQuat, 0.15);
      }
    } else if (isStrafing) {
      // When ONLY strafing (A/D), face camera forward so strafe animations look correct
      const faceAngle = Math.atan2(forward.x, forward.z);
      const faceQuat = new THREE.Quaternion();
      faceQuat.setFromAxisAngle(new THREE.Vector3(0, 1, 0), faceAngle);
      controlObject.quaternion.slerp(faceQuat, 0.15);
    }

    // Move the character
    const moveForward = forward.clone().multiplyScalar(velocity.z * timeInSeconds);
    const moveSideways = sideways.clone().multiplyScalar(velocity.x * timeInSeconds);

    // Save old position before moving
    const oldPosition = new THREE.Vector3();
    oldPosition.copy(controlObject.position);

    controlObject.position.add(moveForward);
    controlObject.position.add(moveSideways);

    // === Post-movement collision validation ===
    // Check if the NEW position collides with anything. If so, revert.
    const boxSize = 4;
    const newPos = controlObject.position;
    const newBBox = new THREE.Box3(
      new THREE.Vector3(
        newPos.x - boxSize / 2,
        newPos.y - boxSize / 2,
        newPos.z - boxSize / 2,
      ),
      new THREE.Vector3(
        newPos.x + boxSize / 2,
        newPos.y + boxSize / 2,
        newPos.z + boxSize / 2,
      ),
    );

    const allColliders = [...this._fence, ...this._objects];
    if (this._car && !this._isDriving) {
      const carBoxSize = 20;
      const carBBox = new THREE.Box3(
        new THREE.Vector3(this._car.position.x - carBoxSize / 2, -10, this._car.position.z - carBoxSize / 2),
        new THREE.Vector3(this._car.position.x + carBoxSize / 2, 20, this._car.position.z + carBoxSize / 2)
      );
      allColliders.push({ intersectsBox: (box) => box.intersectsBox(carBBox) });
    }
    const collidesAfterMove = allColliders.some((c) => c.intersectsBox(newBBox));

    if (collidesAfterMove) {
      // Try sliding along each axis independently instead of full revert
      // This feels much better than a hard stop — the player can slide along walls

      // Try X-only movement
      const xOnlyPos = new THREE.Vector3(newPos.x, oldPosition.y, oldPosition.z);
      const xBBox = new THREE.Box3(
        new THREE.Vector3(xOnlyPos.x - boxSize / 2, xOnlyPos.y - boxSize / 2, xOnlyPos.z - boxSize / 2),
        new THREE.Vector3(xOnlyPos.x + boxSize / 2, xOnlyPos.y + boxSize / 2, xOnlyPos.z + boxSize / 2),
      );
      const xCollides = allColliders.some((c) => c.intersectsBox(xBBox));

      // Try Z-only movement
      const zOnlyPos = new THREE.Vector3(oldPosition.x, oldPosition.y, newPos.z);
      const zBBox = new THREE.Box3(
        new THREE.Vector3(zOnlyPos.x - boxSize / 2, zOnlyPos.y - boxSize / 2, zOnlyPos.z - boxSize / 2),
        new THREE.Vector3(zOnlyPos.x + boxSize / 2, zOnlyPos.y + boxSize / 2, zOnlyPos.z + boxSize / 2),
      );
      const zCollides = allColliders.some((c) => c.intersectsBox(zBBox));

      if (!xCollides && !zCollides) {
        // Both axes are free individually — pick the one with more movement
        const xDist = Math.abs(newPos.x - oldPosition.x);
        const zDist = Math.abs(newPos.z - oldPosition.z);
        if (xDist > zDist) {
          controlObject.position.copy(xOnlyPos);
        } else {
          controlObject.position.copy(zOnlyPos);
        }
      } else if (!xCollides) {
        controlObject.position.copy(xOnlyPos);
      } else if (!zCollides) {
        controlObject.position.copy(zOnlyPos);
      } else {
        // Both axes collide — full revert, push character slightly out
        controlObject.position.copy(oldPosition);
        velocity.x = 0;
        velocity.z = 0;
      }
    }

    this._position.copy(controlObject.position);

    if (this._mixer) {
      this._mixer.update(timeInSeconds);
    }

    // Check if player is near any interactable object
    this._CheckProximity();
  }
}

class PortfolioWorld {
  constructor() {
    this._Initialize();
  }

  _Initialize() {
    const mobile = _isMobile();

    this._threejs = new THREE.WebGLRenderer({
      antialias: !mobile, // Disable antialiasing on mobile for performance
    });
    this._threejs.outputEncoding = THREE.sRGBEncoding;
    this._threejs.shadowMap.enabled = true;
    this._threejs.shadowMap.type = mobile ? THREE.BasicShadowMap : THREE.PCFSoftShadowMap;
    // Cap pixel ratio at 2 on mobile to avoid GPU overload
    this._threejs.setPixelRatio(Math.min(window.devicePixelRatio, mobile ? 2 : 3));
    this._threejs.setSize(window.innerWidth, window.innerHeight);

    document.body.appendChild(this._threejs.domElement);

    window.addEventListener(
      'resize',
      () => {
        this._OnWindowResize();
      },
      false,
    );

    const fov = 60;
    const near = 1.0;
    const far = 1000.0;
    this._camera = new THREE.PerspectiveCamera(
      fov,
      window.innerWidth / window.innerHeight,
      near,
      far,
    );
    this._camera.position.set(150, 10, 25);

    this._scene = new THREE.Scene();
    const mainLight = new THREE.DirectionalLight(0xffffff, 0.8);
    mainLight.position.set(-50, 100, 50);
    mainLight.target.position.set(0, 0, 0);
    mainLight.castShadow = true;
    mainLight.shadow.bias = -0.0001;
    const shadowRes = mobile ? 1024 : 4096;
    mainLight.shadow.mapSize.width = shadowRes;
    mainLight.shadow.mapSize.height = shadowRes;
    mainLight.shadow.camera.near = 0.5;
    mainLight.shadow.camera.far = 500.0;
    mainLight.shadow.camera.left = -200;
    mainLight.shadow.camera.right = 200;
    mainLight.shadow.camera.top = 200;
    mainLight.shadow.camera.bottom = -200;
    this._scene.add(mainLight);
    const ambientLight = new THREE.AmbientLight(0x404060, 0.25);
    this._scene.add(ambientLight);

    const backLight = new THREE.DirectionalLight(0xffffff, 0.1);
    backLight.position.set(0, 50, -100);
    this._scene.add(backLight);

    const loader = new THREE.CubeTextureLoader();
    const texture = loader.load([
      './resources/images/right.png',
      './resources/images/left.png',
      './resources/images/top.png',
      './resources/images/bottom.png',
      './resources/images/front.png',
      './resources/images/back.png',
    ]);
    texture.encoding = THREE.sRGBEncoding;
    this._scene.background = texture;
    const textureLoader = new THREE.TextureLoader();
    const textureGround = textureLoader.load('./resources/images/ground.jpg');

    textureGround.wrapS = THREE.RepeatWrapping;
    textureGround.wrapT = THREE.RepeatWrapping;
    textureGround.repeat.set(10, 10);
    const planeConfigs = [
      {
        width: 212,
        height: 10,
        depth: 175,
        color: 0x0d0c0c,
        rotationY: 0,
        position: new THREE.Vector3(0, -5, 0),
      },
      {
        width: 72,
        height: 10,
        depth: 105,
        color: 0x0d0c0c,
        rotationY: 0,
        position: new THREE.Vector3(280, -5, 0),
      },
      {
        width: 35,
        height: 10,
        depth: 158,
        color: 0x0d0c0c,
        rotationY: Math.PI / 2,
        position: new THREE.Vector3(185, -5, 0),
      },
      {
        width: 80,
        height: 10,
        depth: 44,
        color: 0x0d0c0c,
        rotationY: Math.PI / 2,
        position: new THREE.Vector3(-17, -5, -127),
      },
      {
        width: 60,
        height: 10,
        depth: 60,
        color: 0x0d0c0c,
        rotationY: 0,
        position: new THREE.Vector3(-850, -5, -350),
      },
    ];

    planeConfigs.forEach((config) => {
      const plane = createPlane(
        config.width,
        config.height,
        config.depth,
        textureGround,
        config.color,
        config.rotationY,
        config.position,
      );
      this._scene.add(plane);
    });

    this._mixers = [];
    this._previousRAF = null;

    this._LoadAnimatedModel();
    this._CreateAmbientParticles();
    this._CreateInteractableGlows();
    this._RAF();
  }

  _LoadAnimatedModel() {
    const params = {
      camera: this._camera,
      scene: this._scene,
    };
    this._controls = new BasicCharacterController(params);

    this._thirdPersonCamera = new ThirdPersonCamera({
      camera: this._camera,
      target: this._controls,
      renderer: this._threejs,
    });

    // Give the character controller a reference to the camera for direction alignment
    this._controls._thirdPersonCamera = this._thirdPersonCamera;
  }

  _OnWindowResize() {
    this._camera.aspect = window.innerWidth / window.innerHeight;
    this._camera.updateProjectionMatrix();
    this._threejs.setSize(window.innerWidth, window.innerHeight);
  }

  _RAF() {
    requestAnimationFrame((t) => {
      if (this._previousRAF === null) {
        this._previousRAF = t;
      }

      this._RAF();

      this._threejs.render(this._scene, this._camera);
      this._Step(t - this._previousRAF);
      this._previousRAF = t;
    });
  }

  _Step(timeElapsed) {
    const timeElapsedS = timeElapsed * 0.001;
    if (this._mixers) {
      this._mixers.map((m) => m.update(timeElapsedS));
    }

    if (this._controls) {
      this._controls.Update(timeElapsedS);
    }

    this._thirdPersonCamera.Update(timeElapsedS);

    // Animate ambient particles
    if (this._particles) {
      const positions = this._particles.geometry.attributes.position.array;
      for (let i = 0; i < positions.length; i += 3) {
        positions[i + 1] += 0.02 * Math.sin(Date.now() * 0.001 + i);
        if (positions[i + 1] > 40) positions[i + 1] = 0;
      }
      this._particles.geometry.attributes.position.needsUpdate = true;
    }

    // Pulse interactable glows
    if (this._glowLights) {
      const pulse = 0.5 + 0.5 * Math.sin(Date.now() * 0.002);
      this._glowLights.forEach((light) => {
        light.intensity = light.userData.baseIntensity * (0.6 + pulse * 0.4);
      });
    }
  }

  _CreateAmbientParticles() {
    const particleCount = 300;
    const geometry = new THREE.BufferGeometry();
    const positions = new Float32Array(particleCount * 3);

    for (let i = 0; i < particleCount * 3; i += 3) {
      positions[i] = (Math.random() - 0.5) * 400;     // x
      positions[i + 1] = Math.random() * 40;            // y
      positions[i + 2] = (Math.random() - 0.5) * 300;  // z
    }

    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));

    const material = new THREE.PointsMaterial({
      color: 0x26fffd,
      size: 0.5,
      transparent: true,
      opacity: 0.4,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });

    this._particles = new THREE.Points(geometry, material);
    this._scene.add(this._particles);
  }

  _CreateInteractableGlows() {
    this._glowLights = [];

    const glowPositions = [
      { x: 0, y: 15, z: -8, color: 0x26fffd, intensity: 0.6 },      // About sign
      { x: 98, y: 15, z: -58, color: 0x5b16d4, intensity: 0.5 },    // Project sign
      { x: 98, y: 15, z: 43, color: 0xff6b35, intensity: 0.5 },     // Blog sign
      { x: 110, y: 10, z: 0, color: 0x22c55e, intensity: 0.5 },     // Experience
      { x: 308, y: 8, z: 0, color: 0x26fffd, intensity: 0.8 },      // Table/desk
      { x: -55, y: 8, z: 3, color: 0xff4488, intensity: 0.5 },      // Lounge
    ];

    glowPositions.forEach((glow) => {
      const pointLight = new THREE.PointLight(glow.color, glow.intensity, 30);
      pointLight.position.set(glow.x, glow.y, glow.z);
      pointLight.userData.baseIntensity = glow.intensity;
      this._scene.add(pointLight);
      this._glowLights.push(pointLight);
    });
  }
}

let _APP = null;

// ===== Welcome Screen Particles =====
function initWelcomeParticles() {
  const container = document.getElementById('welcome-particles');
  if (!container) return;
  for (let i = 0; i < 40; i++) {
    const particle = document.createElement('div');
    particle.className = 'welcome-particle';
    particle.style.left = Math.random() * 100 + '%';
    particle.style.animationDelay = Math.random() * 6 + 's';
    particle.style.animationDuration = (Math.random() * 4 + 4) + 's';
    particle.style.width = (Math.random() * 4 + 1) + 'px';
    particle.style.height = particle.style.width;
    container.appendChild(particle);
  }
}

// ===== HUD Key Highlighting =====
function initHUDKeyHighlighting() {
  const keyMap = {
    'w': 'hud-w', 'W': 'hud-w',
    'a': 'hud-a', 'A': 'hud-a',
    's': 'hud-s', 'S': 'hud-s',
    'd': 'hud-d', 'D': 'hud-d',
    'Shift': 'hud-shift',
  };

  document.addEventListener('keydown', (e) => {
    const id = keyMap[e.key];
    if (id) {
      const el = document.getElementById(id);
      if (el) el.classList.add('active');
    }
  });

  document.addEventListener('keyup', (e) => {
    const id = keyMap[e.key];
    if (id) {
      const el = document.getElementById(id);
      if (el) el.classList.remove('active');
    }
  });
}

// ===== Mobile Virtual Joystick =====
function initMobileJoystick() {
  const base = document.getElementById('joystick-base');
  const stick = document.getElementById('joystick-stick');
  if (!base || !stick) return;

  const maxDistance = 40;
  let isActive = false;
  let startX, startY;

  // Simulate key presses for the existing input system
  const simulateKey = (code, down) => {
    const event = new KeyboardEvent(down ? 'keydown' : 'keyup', {
      keyCode: code,
      bubbles: true,
    });
    document.dispatchEvent(event);
  };

  let activeKeys = { w: false, a: false, s: false, d: false, shift: false };

  base.addEventListener('touchstart', (e) => {
    e.preventDefault();
    isActive = true;
    const touch = e.touches[0];
    const rect = base.getBoundingClientRect();
    startX = rect.left + rect.width / 2;
    startY = rect.top + rect.height / 2;
  }, { passive: false });

  document.addEventListener('touchmove', (e) => {
    if (!isActive) return;
    e.preventDefault();
    const touch = e.touches[0];
    let dx = touch.clientX - startX;
    let dy = touch.clientY - startY;
    const dist = Math.sqrt(dx * dx + dy * dy);

    if (dist > maxDistance) {
      dx = dx / dist * maxDistance;
      dy = dy / dist * maxDistance;
    }

    stick.style.transform = `translate(calc(-50% + ${dx}px), calc(-50% + ${dy}px))`;

    const thresholdY = 20; // Forward/backward deadzone
    const thresholdX = 30; // Turning deadzone (larger to prevent accidental spins)
    const isRunning = dist > maxDistance * 0.95; // Require full push to run

    // Forward/backward (W=87, S=83)
    if (dy < -thresholdY && !activeKeys.w) {
      simulateKey(87, true);
      activeKeys.w = true;
    } else if (dy >= -thresholdY && activeKeys.w) {
      simulateKey(87, false);
      activeKeys.w = false;
    }

    if (dy > thresholdY && !activeKeys.s) {
      simulateKey(83, true);
      activeKeys.s = true;
    } else if (dy <= thresholdY && activeKeys.s) {
      simulateKey(83, false);
      activeKeys.s = false;
    }

    // Left/right rotation (A=65, D=68)
    if (dx < -thresholdX && !activeKeys.a) {
      simulateKey(65, true);
      activeKeys.a = true;
    } else if (dx >= -thresholdX && activeKeys.a) {
      simulateKey(65, false);
      activeKeys.a = false;
    }

    if (dx > thresholdX && !activeKeys.d) {
      simulateKey(68, true);
      activeKeys.d = true;
    } else if (dx <= thresholdX && activeKeys.d) {
      simulateKey(68, false);
      activeKeys.d = false;
    }

    // Shift for running (16)
    if (isRunning && !activeKeys.shift) {
      simulateKey(16, true);
      activeKeys.shift = true;
    } else if (!isRunning && activeKeys.shift) {
      simulateKey(16, false);
      activeKeys.shift = false;
    }
  }, { passive: false });

  const resetJoystick = () => {
    if (!isActive) return;
    isActive = false;
    stick.style.transform = 'translate(-50%, -50%)';

    // Release all keys
    if (activeKeys.w) { simulateKey(87, false); activeKeys.w = false; }
    if (activeKeys.a) { simulateKey(65, false); activeKeys.a = false; }
    if (activeKeys.s) { simulateKey(83, false); activeKeys.s = false; }
    if (activeKeys.d) { simulateKey(68, false); activeKeys.d = false; }
    if (activeKeys.shift) { simulateKey(16, false); activeKeys.shift = false; }
  };

  document.addEventListener('touchend', resetJoystick);
  document.addEventListener('touchcancel', resetJoystick);
}

// ===== Init =====
window.addEventListener('DOMContentLoaded', () => {
  const mobile = _isMobile();

  if (mobile) {
    document.body.classList.add('is-mobile');

    // Update hint text for mobile
    const hintEl = document.getElementById('welcome-hint');
    if (hintEl) {
      hintEl.textContent = 'Works on mobile · Use joystick to move · TAP to interact';
    }
  }

  initWelcomeParticles();
  initHUDKeyHighlighting();

  const enterBtn = document.getElementById('enter-world-btn');
  const welcomeScreen = document.getElementById('welcome-screen');

  if (enterBtn && welcomeScreen) {
    enterBtn.addEventListener('click', () => {
      welcomeScreen.classList.add('hide');
      setTimeout(() => {
        welcomeScreen.remove();
      }, 800);

      // Initialize the 3D world
      _APP = new PortfolioWorld();

      // Initialize mobile joystick
      initMobileJoystick();
    });
  } else {
    // Fallback if welcome screen elements are missing
    _APP = new PortfolioWorld();
    initMobileJoystick();
  }
});
