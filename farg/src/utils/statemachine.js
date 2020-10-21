import * as stateClasses from "./states";

// StateMachine updates the current state and moves to the next if it is supposed to.
class StateMachine {
  // The colorCallback is called once a new swatch was found
  constructor(colorCallback, setTextCallback) {
    this.state = "idle";
    this.states = {
      idle: new stateClasses.Idle(setTextCallback),
      found: new stateClasses.Found(
        (shouldTick) => (this.TICK_ENABLED = shouldTick)
      ),
      flash: new stateClasses.Flash(),
      colorSteal: new stateClasses.ColorSteal(colorCallback),
    };
    this.TICK_ENABLED = true;
    this.lastTime = new Date();
  }
  async tick(drawCtx, video, videoBuffer, posenet) {
    if (!this.TICK_ENABLED) {
      return;
    }

    let now = new Date();
    let dt = now - this.lastTime;
    this.lastTime = now;

    this.state = await this.states[this.state].tick(
      drawCtx,
      video,
      videoBuffer,
      posenet,
      dt
    );
  }
}

export default StateMachine;
