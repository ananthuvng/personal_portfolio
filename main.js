import * as THREE from "https://cdn.jsdelivr.net/npm/three@0.118/build/three.module.js";
import { FBXLoader } from "https://cdn.jsdelivr.net/npm/three@0.118.1/examples/jsm/loaders/FBXLoader.js";
import {
  _hideLoadingScreen,
  _showLoadingScreen,
  _updateLoadingProgress,
} from "./loading.js";
import { sliderShow } from "./showPages.js";
import { startSpaceShooterGame } from "./game.js";
import {
  checkIntersection,
  createBox3,
  createBox3Debug,
  createPlane,
  findChildByName,
  isDescendantOf,
} from "./utils.js";
import { fenceDefinitions, objectsDefinitions } from "./const.js";
import { CharacterFSM } from "./characterFSM.js";
import { ThirdPersonCamera } from "./thirdPersonCamera.js";
import { createModernDesktop } from "./osinterface.js";
import { showCredits } from "./modelsUsed.js";
import { credits } from "./credits.js";
import { CharacterInput } from "./characterInput.js";

class BasicCharacterControllerProxy {
  constructor(animations) {
    this._animations = animations;
  }

  get animations() {
    return this._animations;
  }
}

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
      new BasicCharacterControllerProxy(this._animations)
    );
    this._fence = fenceDefinitions.map((fence) => {
      const fencebox = createBox3(
        fence.width,
        fence.length,
        fence.height,
        fence.x,
        fence.y,
        fence.z,
        fence.angle
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
        object.color
      );
      this._params.scene.add(objectBox);
      return objectBox;
    });
    this._collisionDirection = null;
    this._onaAnotherWindow = false;
    this._wasInCollision = false;
    this._LoadModels();

    this._AddMouseClickListener();
  }

  _setupAudio() {
    this._audioListener = new THREE.AudioListener();
    this._params.camera.add(this._audioListener);
    this._walkingSound = new THREE.Audio(this._audioListener);
    const audioLoader = new THREE.AudioLoader();
    audioLoader.load("./resources/audio/walking.mp3", (buffer) => {
      this._walkingSound.setBuffer(buffer);
      this._walkingSound.setLoop(true);
      this._walkingSound.setVolume(0.5);
    });
  }

  _updateSound(state) {
    if (
      !this._walkingSound.isPlaying &&
      (state === "walk" || state === "run" || state === "walkback")
    ) {
      this._walkingSound.play();
      this._walkingSound.setPlaybackRate(state === "run" ? 1.8 : 1.0);
    } else if (
      this._walkingSound.isPlaying &&
      state !== "walk" &&
      state !== "run" &&
      state !== "walkback"
    ) {
      this._walkingSound.stop();
    } else if (this._walkingSound.isPlaying) {
      this._walkingSound.setPlaybackRate(state === "run" ? 1.8 : 1.0);
    }
  }

  _LoadModels() {
    _showLoadingScreen();
    this._manager = new THREE.LoadingManager(
      () => {
        _hideLoadingScreen();
        if (this._stateMachine) {
          this._stateMachine.SetState("idle");
        }
      },
      (url, itemsLoaded, itemsTotal) => {
        const progress = Math.round((itemsLoaded / itemsTotal) * 100);
        _updateLoadingProgress(progress);
      }
    );

    const loader = new FBXLoader(this._manager);
    loader.setPath("./resources/models/");
    loader.load("about.fbx", (fbx) => {
      fbx.traverse((c) => {
        c.castShadow = true;
        if (c.material) {
          c.material.transparent = true;
          c.material.opacity = 3;
        }
      });
      fbx.rotation.y = -Math.PI / 2;
      fbx.scale.setScalar(50);
      fbx.position.set(0, 15, -8);

      this._params.scene.add(fbx);

      this._about = fbx;
    });

    loader.load("table.fbx", (fbx) => {
      fbx.traverse((c) => {
        if (c.material) {
          c.material.transparent = true;
          c.material.opacity = 6;
        }
      });
      fbx.rotation.y = -Math.PI / 2;
      fbx.scale.setScalar(0.068);
      fbx.position.set(308, 0, 0);
      this._table = fbx;
      this._params.scene.add(fbx);
    });

    loader.load("project.fbx", (fbx) => {
      fbx.traverse((c) => {
        if (c.material) {
          c.material.transparent = true;
          c.material.opacity = 3;
        }
      });
      fbx.rotation.y = -Math.PI / 2;
      fbx.scale.setScalar(40);
      fbx.position.set(98, 15, -58);
      this._params.scene.add(fbx);
      this._project = fbx;
    });
    loader.load("blog.fbx", (fbx) => {
      fbx.traverse((c) => {
        if (c.material) {
          c.material.transparent = true;
          c.material.opacity = 3;
        }
      });
      fbx.rotation.y = -Math.PI / 2;
      fbx.scale.setScalar(40);
      fbx.position.set(98, 15, 43);
      this._params.scene.add(fbx);
      this._blog = fbx;
    });

    loader.load("exp.fbx", (fbx) => {
      fbx.traverse((c) => {
        if (c.material) {
          c.material.transparent = true;
          c.material.opacity = 3;
        }
      });
      fbx.rotation.y = Math.PI / 2;
      fbx.scale.setScalar(0.4);
      fbx.position.set(110, 10, 0);
      this._experience = fbx;
      this._params.scene.add(fbx);
    });

    loader.load("projector.fbx", (fbx) => {
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

    loader.load("instruction.fbx", (fbx) => {
      fbx.traverse((c) => {
        c.castShadow = true;
      });
      fbx.scale.setScalar(3);
      fbx.position.set(-75, 0, -5);
      this._instruction = fbx;
      this._params.scene.add(fbx);
    });
    loader.load("spacecablecar.fbx", (fbx) => {
      fbx.traverse((c) => {
        c.castShadow = true;
      });

      fbx.scale.setScalar(0.5);
      fbx.rotation.y = -Math.PI / 2;

      fbx.position.set(-600, 30, -200);
      this._params.scene.add(fbx);

      this._carfly = fbx;
    });
    loader.load("lounge.fbx", (fbx) => {
      fbx.traverse((c) => {
        c.castShadow = true;
      });

      this._gaming = findChildByName(
        fbx,
        "Bar_completo2ARCADE_Bar_completo2Mat_Arcade_SI_0"
      );

      this._credits = findChildByName(
        fbx,
        "Bar_completo2base_del_tacho_Bar_completo2Atlas2_0003"
      );
      this._push = findChildByName(
        fbx,
        "Bar_completo2base_del_tacho_Bar_completo2Atlas2_000"
      );

      fbx.scale.setScalar(0.4);
      fbx.position.set(-55, -2, 3);
      fbx.rotation.y = -Math.PI / 2;
      this._params.scene.add(fbx);
    });
    loader.load("entrance.fbx", (fbx) => {
      fbx.traverse((c) => {
        c.castShadow = true;
      });

      fbx.scale.setScalar(0.048);
      fbx.position.set(-17, -4, -155);
      this._params.scene.add(fbx);
    });
    loader.load("scififence.fbx", (fbx) => {
      fbx.traverse((c) => {
        c.castShadow = true;
        if (c.material) {
          c.material.transparent = true;
          c.material.opacity = 10;
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

    loader.load("ananthu.fbx", (fbx) => {
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
        this._stateMachine.SetState("idle");
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
      loader.setPath("./resources/models/");
      loader.load("walking.fbx", (a) => {
        _OnLoad("walk", a);
      });
      loader.load("running.fbx", (a) => {
        _OnLoad("run", a);
      });
      loader.load("breathing.fbx", (a) => {
        _OnLoad("idle", a);
      });
      loader.load("dancing.fbx", (a) => {
        _OnLoad("dance", a);
      });
      loader.load("walkingback.fbx", (a) => {
        _OnLoad("walkback", a);
      });
      loader.load("walkleft.fbx", (a) => {
        _OnLoad("walkleft", a);
      });
      loader.load("walkright.fbx", (a) => {
        _OnLoad("walkright", a);
      });
    });
    setTimeout(() => {
      sliderShow(this, ["./resources/images/instruction.png"]);
    }, 3000);
  }

  _AddMouseClickListener() {
    window.addEventListener(
      "click",
      (event) => this._OnMouseClick(event),
      false
    );
  }

  _OnMouseClick(event) {
    this._mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
    this._mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

    this._raycaster.setFromCamera(this._mouse, this._params.camera);
    const intersects = this._raycaster.intersectObjects(
      this._params.scene.children,
      true
    );

    if (intersects.length > 0 && !this._onaAnotherWindow) {
      const isAboutClicked = intersects.some((intersect) =>
        isDescendantOf(intersect.object, this._about)
      );

      const isGamingClicked = intersects.some((intersect) =>
        isDescendantOf(intersect.object, this._gaming)
      );
      const isCreditsClicked = intersects.some((intersect) =>
        isDescendantOf(intersect.object, this._credits)
      );

      const isExperienceClicked = intersects.some((intersect) =>
        isDescendantOf(intersect.object, this._experience)
      );

      const isBlogClicked = intersects.some((intersect) =>
        isDescendantOf(intersect.object, this._blog)
      );
      const isProjectClicked = intersects.some((intersect) =>
        isDescendantOf(intersect.object, this._project)
      );

      const isTableClicked = intersects.some((intersect) =>
        isDescendantOf(intersect.object, this._table)
      );
      const isInstructionClicked = intersects.some((intersect) =>
        isDescendantOf(intersect.object, this._instruction)
      );
      if (isAboutClicked) {
        this._onaAnotherWindow = true;
        sliderShow(this, ["./resources/images/about.png"]);
      } else if (isTableClicked) {
        this._onaAnotherWindow = true;
        createModernDesktop(this);
      } else if (isCreditsClicked) {
        this._onaAnotherWindow = true;
        showCredits(this, credits);
      } else if (isBlogClicked) {
        this._onaAnotherWindow = true;
        sliderShow(this, ["./resources/images/blogs.png"]);
      } else if (isGamingClicked) {
        this._onaAnotherWindow = true;
        startSpaceShooterGame(this);
      } else if (isExperienceClicked) {
        this._onaAnotherWindow = true;
        sliderShow(this, [
          "./resources/images/experince.png",
          "./resources/images/ellucian.png",
          "./resources/images/cisco.png",
        ]);
      } else if (isProjectClicked) {
        this._onaAnotherWindow = true;
        sliderShow(this, [
          "./resources/images/projects.png",
          "./resources/images/souls.png",
          "./resources/images/sanchari.png",
        ]);
      } else if (isInstructionClicked) {
        this._onaAnotherWindow = true;
        sliderShow(this, ["./resources/images/instruction.png"]);
      }
    }
  }

  get Position() {
    return this._position;
  }

  get Rotation() {
    if (!this._target) {
      return new THREE.Quaternion();
    }
    return this._target.quaternion;
  }

  Update(timeInSeconds) {
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
      velocity.z * this._decceleration.z
    );
    frameDecceleration.multiplyScalar(timeInSeconds);
    frameDecceleration.z =
      Math.sign(frameDecceleration.z) *
      Math.min(Math.abs(frameDecceleration.z), Math.abs(velocity.z));

    velocity.add(frameDecceleration);

    const characterPosition = this._target.position;
    const boxSize = 4;
    const characterBBox = new THREE.Box3(
      new THREE.Vector3(
        characterPosition.x - boxSize / 2,
        characterPosition.y - boxSize / 2,
        characterPosition.z - boxSize / 2
      ),
      new THREE.Vector3(
        characterPosition.x + boxSize / 2,
        characterPosition.y + boxSize / 2,
        characterPosition.z + boxSize / 2
      )
    );

    const collidesWithAnyFence = this._fence.some((fence) =>
      fence.intersectsBox(characterBBox)
    );
    const collidesWithAnyObjects = this._objects.some((obj) =>
      obj.intersectsBox(characterBBox)
    );

    if (collidesWithAnyFence || collidesWithAnyObjects) {
      const forward = new THREE.Vector3(0, 0, 1);
      forward.applyQuaternion(this._target.quaternion);
      forward.normalize();

      const collisionObjects = [...this._fence, ...this._objects];
      for (const obj of collisionObjects) {
        if (obj.intersectsBox(characterBBox)) {
          const collisionDirection = new THREE.Vector3();
          collisionDirection.subVectors(
            obj.getCenter(new THREE.Vector3()),
            characterBBox.getCenter(new THREE.Vector3())
          );
          collisionDirection.normalize();

          const dot = forward.dot(collisionDirection);
          if (dot > 0) {
            this._collisionDirection = "front";
          } else {
            this._collisionDirection = "back";
          }
          break;
        }
      }
    }

    this._stateMachine.Update(timeInSeconds, this._input);

    const controlObject = this._target;
    const _Q = new THREE.Quaternion();
    const _A = new THREE.Vector3();
    const _R = controlObject.quaternion.clone();

    const acc = this._acceleration.clone();
    if (this._input._keys.shift) {
      acc.multiplyScalar(2.0);
    }

    if (this._stateMachine._currentState.Name == "dance") {
      acc.multiplyScalar(0.0);
    }
    if (this._walkingSound && this._stateMachine._currentState) {
      this._updateSound(this._stateMachine._currentState.Name);
    }

    if (collidesWithAnyFence || collidesWithAnyObjects) {
      if (
        !this._input._keys.backward &&
        !this._input._keys.forward &&
        !this._input._keys.right &&
        !this._input._keys.left
      ) {
        velocity.x = 0;
        velocity.y = 0;
        velocity.z = 0;
      } else {
        this._wasInCollision = true;
        velocity.z = 0;
        if (
          this._collisionDirection === "front" &&
          this._input._keys.backward
        ) {
          velocity.z -= acc.z * timeInSeconds;
        } else if (
          this._collisionDirection === "back" &&
          this._input._keys.forward
        ) {
          velocity.z += acc.z * timeInSeconds;
        }

        if (this._input._keys.left) {
          _A.set(0, 1, 0);
          _Q.setFromAxisAngle(
            _A,
            4.0 * Math.PI * timeInSeconds * this._acceleration.y
          );
          _R.multiply(_Q);
        }
        if (this._input._keys.right) {
          _A.set(0, 1, 0);
          _Q.setFromAxisAngle(
            _A,
            4.0 * -Math.PI * timeInSeconds * this._acceleration.y
          );
          _R.multiply(_Q);
        }
      }
    } else {
      if (this._wasInCollision) {
        velocity.z = 0;
        this._wasInCollision = false;
        this._collisionDirection = null;
      }

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
      if (this._input._keys.moveRight) {
        velocity.x -= acc.x * timeInSeconds * 2;
      }
      if (this._input._keys.moveLeft) {
        velocity.x += acc.x * timeInSeconds * 2;
      }
      if (this._input._keys.left) {
        _A.set(0, 1, 0);
        _Q.setFromAxisAngle(
          _A,
          4.0 * Math.PI * timeInSeconds * this._acceleration.y
        );
        _R.multiply(_Q);
      }
      if (this._input._keys.right) {
        _A.set(0, 1, 0);
        _Q.setFromAxisAngle(
          _A,
          4.0 * -Math.PI * timeInSeconds * this._acceleration.y
        );
        _R.multiply(_Q);
      }
    }

    controlObject.quaternion.copy(_R);

    const oldPosition = new THREE.Vector3();
    oldPosition.copy(controlObject.position);

    const forward = new THREE.Vector3(0, 0, 1);
    forward.applyQuaternion(controlObject.quaternion);
    forward.normalize();

    const sideways = new THREE.Vector3(1, 0, 0);
    sideways.applyQuaternion(controlObject.quaternion);
    sideways.normalize();

    sideways.multiplyScalar(velocity.x * timeInSeconds);
    forward.multiplyScalar(velocity.z * timeInSeconds);

    controlObject.position.add(forward);
    controlObject.position.add(sideways);

    this._position.copy(controlObject.position);

    if (this._mixer) {
      this._mixer.update(timeInSeconds);
    }
  }
}

class PortfolioWorld {
  constructor() {
    this._Initialize();
  }

  _Initialize() {
    this._threejs = new THREE.WebGLRenderer({
      antialias: true,
    });
    this._threejs.outputEncoding = THREE.sRGBEncoding;
    this._threejs.shadowMap.enabled = true;
    this._threejs.shadowMap.type = THREE.PCFSoftShadowMap;
    this._threejs.setPixelRatio(window.devicePixelRatio);
    this._threejs.setSize(window.innerWidth, window.innerHeight);

    document.body.appendChild(this._threejs.domElement);

    window.addEventListener(
      "resize",
      () => {
        this._OnWindowResize();
      },
      false
    );

    const fov = 60;
    const near = 1.0;
    const far = 1000.0;
    this._camera = new THREE.PerspectiveCamera(
      fov,
      window.innerWidth / window.innerHeight,
      near,
      far
    );
    this._camera.position.set(150, 10, 25);

    this._scene = new THREE.Scene();
    const mainLight = new THREE.DirectionalLight(0xffffff, 0.8);
    mainLight.position.set(-50, 100, 50);
    mainLight.target.position.set(0, 0, 0);
    mainLight.castShadow = true;
    mainLight.shadow.bias = -0.0001;
    mainLight.shadow.mapSize.width = 4096;
    mainLight.shadow.mapSize.height = 4096;
    mainLight.shadow.camera.near = 0.5;
    mainLight.shadow.camera.far = 500.0;
    mainLight.shadow.camera.left = -200;
    mainLight.shadow.camera.right = 200;
    mainLight.shadow.camera.top = 200;
    mainLight.shadow.camera.bottom = -200;
    this._scene.add(mainLight);
    const ambientLight = new THREE.AmbientLight(0x404040, 0.1);
    this._scene.add(ambientLight);

    const backLight = new THREE.DirectionalLight(0xffffff, 0.1);
    backLight.position.set(0, 50, -100);
    this._scene.add(backLight);

    const loader = new THREE.CubeTextureLoader();
    const texture = loader.load([
      "./resources/images/right.png",
      "./resources/images/left.png",
      "./resources/images/top.png",
      "./resources/images/bottom.png",
      "./resources/images/front.png",
      "./resources/images/back.png",
    ]);
    texture.encoding = THREE.sRGBEncoding;
    this._scene.background = texture;
    const textureLoader = new THREE.TextureLoader();
    const textureGround = textureLoader.load("./resources/images/ground.jpg");

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
        config.position
      );
      this._scene.add(plane);
    });

    this._mixers = [];
    this._previousRAF = null;

    this._LoadAnimatedModel();
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
    });
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
  }
}

let _APP = null;

window.addEventListener("DOMContentLoaded", () => {
  _APP = new PortfolioWorld();
});

function _LerpOverFrames(frames, t) {
  const s = new THREE.Vector3(0, 0, 0);
  const e = new THREE.Vector3(100, 0, 0);
  const c = s.clone();

  for (let i = 0; i < frames; i++) {
    c.lerp(e, t);
  }
  return c;
}

function _TestLerp(t1, t2) {
  const v1 = _LerpOverFrames(100, t1);
  const v2 = _LerpOverFrames(50, t2);
  console.log(v1.x + " | " + v2.x);
}

_TestLerp(0.01, 0.01);
_TestLerp(1.0 / 100.0, 1.0 / 50.0);
_TestLerp(1.0 - Math.pow(0.3, 1.0 / 100.0), 1.0 - Math.pow(0.3, 1.0 / 50.0));
