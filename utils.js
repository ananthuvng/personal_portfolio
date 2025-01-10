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
    position.x + width / 2,
    position.y + height / 2,
    position.z + length / 2,
  );

  const rotationMatrix = new THREE.Matrix4().makeRotationY(angle);

  min.applyMatrix4(rotationMatrix);
  max.applyMatrix4(rotationMatrix);

  const geometry = new THREE.BoxGeometry(width, height, length);

  const material = new THREE.MeshBasicMaterial({ color: color });

  const fenceMesh = new THREE.Mesh(geometry, material);

  fenceMesh.position.set(position.x, position.y, position.z);

  fenceMesh.rotation.y = angle;

  return fenceMesh;
}

export function checkIntersection(mesh, otherBox) {
  const boundingBox = new THREE.Box3().setFromObject(mesh);
  return boundingBox.intersectsBox(otherBox);
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

  const box3 = new THREE.Box3(
    new THREE.Vector3(-width / 2, -height / 2, -length / 2),
    new THREE.Vector3(width / 2, height / 2, length / 2),
  );

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

  const rotationMatrix = new THREE.Matrix4()
    .makeRotationY(angle)
    .setPosition(position);
  box3.applyMatrix4(rotationMatrix);

  return {
    box3,
    debugMesh,
    checkCollision: function (otherBox3) {
      return box3.intersectsBox(otherBox3);
    },
  };
}

export function getBox3Dimensions(box3) {
  const size = {
    width: Math.abs(box3.max.x - box3.min.x),
    height: Math.abs(box3.max.y - box3.min.y),
    length: Math.abs(box3.max.z - box3.min.z),
  };
  return size;
}

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
    new THREE.BoxGeometry(width, height, depth),
    new THREE.MeshStandardMaterial({
      map: texture,
      color: color,
    }),
  );

  plane.rotation.y = rotationY;

  plane.castShadow = false;
  plane.receiveShadow = true;

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
