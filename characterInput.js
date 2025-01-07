export class CharacterInput {
  constructor() {
    this._Init();
  }

  _Init() {
    this._keys = {
      forward: false,
      backward: false,
      left: false,
      right: false,
      space: false,
      shift: false,
      moveLeft: false,
      moveRight: false,
    };
    document.addEventListener('keydown', (e) => this._onKeyDown(e), false);
    document.addEventListener('keyup', (e) => this._onKeyUp(e), false);
  }

  _onKeyDown(event) {
    switch (event.keyCode) {
      case 87:
        this._keys.forward = true;
        break; // w
      case 65:
        this._keys.left = true;
        break; // a
      case 83:
        this._keys.backward = true;
        break; // s
      case 68:
        this._keys.right = true;
        break; // d
      case 32:
        this._keys.space = true;
        break; // SPACE
      case 16:
        this._keys.shift = true;
        break; // SHIFT
      case 37:
        this._keys.moveLeft = true;
        break; // LEFT
      case 39:
        this._keys.moveRight = true;
        break; // RIGHT
    }
  }

  _onKeyUp(event) {
    switch (event.keyCode) {
      case 87:
        this._keys.forward = false;
        break;
      case 65:
        this._keys.left = false;
        break;
      case 83:
        this._keys.backward = false;
        break;
      case 68:
        this._keys.right = false;
        break;
      case 32:
        this._keys.space = false;
        break;
      case 16:
        this._keys.shift = false;
        break;
      case 37:
        this._keys.moveLeft = false;
        break;
      case 39:
        this._keys.moveRight = false;
        break;
    }
  }
}
