import * as stateClasses from "./states";

// StateMachine updates the current state and moves to the next if it is supposed to.
class StateMachine {
  state: string;
  states: {
    idle: any;
    found: any;
    flash: any;
    colorSteal: any;
  };
  TICK_ENABLED: boolean;

  // The colorCallback is called once a new swatch was found
  constructor(colorCallback) {
    this.state = "idle";
    this.states = {
      idle: new stateClasses.Idle(),
      found: new stateClasses.Found(
        shouldTick => (this.TICK_ENABLED = shouldTick)
      ),
      flash: new stateClasses.Flash(),
      colorSteal: new stateClasses.ColorSteal(colorCallback)
    };
    this.TICK_ENABLED = true;
  }
  async tick(drawCtx, video, videoBuffer, posenet) {
    if (!this.TICK_ENABLED) {
      return;
    }
    this.state = await this.states[this.state].tick(
      drawCtx,
      video,
      videoBuffer,
      posenet
    );
  }
}

export default StateMachine;
