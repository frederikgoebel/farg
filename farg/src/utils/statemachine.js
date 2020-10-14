import * as stateClasses from './states';

// StateMachine updates the current state and moves to the next if it is supposed to.
class StateMachine {
  // The colorCallback is called once a new swatch was found
  constructor(colorCallback) {
    this.state = "idle";
    this.states = {
      "idle": new stateClasses.Idle(),
      "found": new stateClasses.Found(),
      "flash": new stateClasses.Flash(),
      "colorSteal": new stateClasses.ColorSteal(colorCallback),
    }
  }
  async tick(drawCtx, video, videoBuffer, posenet) {
    this.state = await this.states[this.state].tick(drawCtx, video, videoBuffer, posenet);
  }
}

export default StateMachine
