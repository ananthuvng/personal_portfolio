import {
  IdleState,
  WalkState,
  RunState,
  DanceState,
  WalkBackState,
  WalkLeftState,
  WalkRightState,
} from './characterStates.js';

export class FiniteStateMachine {
  constructor() {
    this._states = {};
    this._currentState = null;
  }

  _AddState(name, type) {
    this._states[name] = type;
  }

  SetState(name) {
    const prevState = this._currentState;

    if (prevState) {
      if (prevState.Name == name) return;
      prevState.Exit();
    }

    const state = new this._states[name](this);
    this._currentState = state;
    state.Enter(prevState);
  }

  Update(timeElapsed, input) {
    if (this._currentState) {
      this._currentState.Update(timeElapsed, input);
    }
  }
}

export class CharacterFSM extends FiniteStateMachine {
  constructor(proxy) {
    super();
    this._proxy = proxy;
    this._Init();
  }

  _Init() {
    this._AddState('idle', IdleState);
    this._AddState('walk', WalkState);
    this._AddState('walkback', WalkBackState);
    this._AddState('run', RunState);
    this._AddState('dance', DanceState);
    this._AddState('walkleft', WalkLeftState);
    this._AddState('walkright', WalkRightState);
  }
}
