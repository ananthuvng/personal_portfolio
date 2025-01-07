import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.118/build/three.module.js';

export function createBox3(width, length, height, x, y, z, angle) {
  const position = new THREE.Vector3(x, y, z);

  const min = new THREE.Vector3(-width / 2, -height / 2, -length / 2);

  const max = new THREE.Vector3(width / 2, height / 2, length / 2);

  const transformMatrix = new THREE.Matrix4()
    .makeRotationY(angle)
    .setPosition(position);

  min.applyMatrix4(transformMatrix);
  max.applyMatrix4(transformMatrix);

  return new THREE.Box3(min, max);
}

export function createBox3Debug(width, length, height, x, y, z, angle, color) {
  const position = new THREE.Vector3(x, y, z);

  const min = new THREE.Vector3(
    position.x - width / 2,
    position.y - height / 2,
    position.z - length / 2,
  );

  const max = new THREE.Vector3(
    position.x + width / 2, // max.x
    position.y + height / 2, // max.y
    position.z + length / 2, // max.z
  );

  // Create a rotation matrix around the Y-axis (or any axis you choose)
  const rotationMatrix = new THREE.Matrix4().makeRotationY(angle); // rotation around Y-axis

  // Apply the rotation to both min and max vectors
  min.applyMatrix4(rotationMatrix);
  max.applyMatrix4(rotationMatrix);

  // Create the geometry for the fence (BoxGeometry)
  const geometry = new THREE.BoxGeometry(width, height, length);

  // Create the material with the given color
  const material = new THREE.MeshBasicMaterial({ color: color });

  // Create the mesh for the fence
  const fenceMesh = new THREE.Mesh(geometry, material);

  // Position the fence mesh
  fenceMesh.position.set(position.x, position.y, position.z);

  // Apply the rotation to the mesh (use the angle passed in)
  fenceMesh.rotation.y = angle;

  // Return the mesh (not Box3 since you want to render it)
  return fenceMesh;
}

// Function to check intersection with another Box3
export function checkIntersection(mesh, otherBox) {
  const boundingBox = new THREE.Box3().setFromObject(mesh); // Get bounding box of the mesh
  return boundingBox.intersectsBox(otherBox); // Check if bounding box intersects with another Box3
}

export function createOptimizedCollider(
  width,
  length,
  height,
  x,
  y,
  z,
  angle,
  isDebug = false,
) {
  const position = new THREE.Vector3(x, y, z);

  // Create an invisible Box3 for efficient collision detection
  const box3 = new THREE.Box3(
    new THREE.Vector3(-width / 2, -height / 2, -length / 2),
    new THREE.Vector3(width / 2, height / 2, length / 2),
  );

  // If in debug mode, create a visible mesh
  let debugMesh = null;
  if (isDebug) {
    const geometry = new THREE.BoxGeometry(width, height, length);
    const material = new THREE.MeshBasicMaterial({
      color: 0xff0000,
      opacity: 0.5,
      transparent: true,
      wireframe: true,
    });
    debugMesh = new THREE.Mesh(geometry, material);
    debugMesh.position.copy(position);
    debugMesh.rotation.y = angle;
  }

  // Transform the Box3
  const rotationMatrix = new THREE.Matrix4()
    .makeRotationY(angle)
    .setPosition(position);
  box3.applyMatrix4(rotationMatrix);

  return {
    box3,
    debugMesh,
    // Method to check collision
    checkCollision: function (otherBox3) {
      return box3.intersectsBox(otherBox3);
    },
  };
}

// Helper function to calculate box dimensions
export function getBox3Dimensions(box3) {
  const size = {
    width: Math.abs(box3.max.x - box3.min.x),
    height: Math.abs(box3.max.y - box3.min.y),
    length: Math.abs(box3.max.z - box3.min.z),
  };
  return size;
}

// Helper function to calculate box center
export function getBox3Center(box3) {
  return new THREE.Vector3(
    (box3.min.x + box3.max.x) / 2,
    (box3.min.y + box3.max.y) / 2,
    (box3.min.z + box3.max.z) / 2,
  );
}

export function findChildByName(parent, targetName) {
  if (parent.name === targetName) {
    return parent;
  } else {
    for (let child of parent.children) {
      const foundInNestedChildren = findChildByName(child, targetName);
      if (foundInNestedChildren) {
        return foundInNestedChildren;
      }
    }
  }
}

export function isDescendantOf(intersectedObject, targetObject) {
  let currentObj = intersectedObject;
  while (currentObj) {
    if (currentObj === targetObject) {
      return true;
    }
    currentObj = currentObj.parent;
  }
  return false;
}

export function createPlane(
  width,
  height,
  depth,
  texture,
  color = 0xffffff,
  rotationY = 0,
  position = new THREE.Vector3(0, -5, 0),
) {
  const plane = new THREE.Mesh(
    new THREE.BoxGeometry(width, height, depth), // width, height, depth
    new THREE.MeshStandardMaterial({
      map: texture, // Texture
      color: color, // Color
    }),
  );

  // Apply rotation (around the Y-axis)
  plane.rotation.y = rotationY;

  // Set common properties
  plane.castShadow = false;
  plane.receiveShadow = true;

  // Position the plane
  plane.position.set(position.x, position.y, position.z);

  return plane;
}

export function setupAudio() {
  this._audioListener = new THREE.AudioListener();
  this._params.camera.add(this._audioListener);
  this._walkingSound = new THREE.Audio(this._audioListener);
  const audioLoader = new THREE.AudioLoader();
  audioLoader.load('./resources/walking.mp3', (buffer) => {
    this._walkingSound.setBuffer(buffer);
    this._walkingSound.setLoop(true);
    this._walkingSound.setVolume(0.5);
  });
}

class CloseButton {
  constructor(container, cleanup, windowStateManager) {
    this.element = document.createElement('div');
    Object.assign(this.element.style, {
      position: 'absolute',
      top: '20px',
      right: '20px',
      width: '40px',
      height: '40px',
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
      width: '20px',
      height: '20px',
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
    this.element.appendChild(closeIcon);

    let isClosing = false;

    this.element.addEventListener('mouseenter', () => {
      this.element.style.backgroundColor = 'rgba(38, 255, 253, 0.8)';
      this.element.style.transform = 'rotate(90deg)';
    });

    this.element.addEventListener('mouseleave', () => {
      this.element.style.backgroundColor = 'rgba(255, 255, 255, 0.1)';
      this.element.style.transform = 'rotate(0deg)';
    });

    this.element.addEventListener('click', () => {
      if (isClosing) return;
      isClosing = true;

      if (windowStateManager) {
        windowStateManager._onaAnotherWindow = false;
      }
      container.style.transform = 'scale(0.8)';
      container.style.opacity = '0';

      setTimeout(() => {
        cleanup();
        document.body.removeChild(container);
      }, 300);
    });
  }
}
