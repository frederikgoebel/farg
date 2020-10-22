import { EasingFunction } from "./easing";
import { HighlightPaletteAnimation } from "./paletteAnimation";

export type Point2D = { x: number; y: number };

export enum AnimationType {
  Active,
  FadeOut,
  Gone,
  ScheduledForDeletion
}

// eslint-disable-next-line @typescript-eslint/no-namespace
namespace Anim {
  export type Active = {
    type: AnimationType.Active;
  };

  export type FadeOut = {
    type: AnimationType.FadeOut;
    elapsedTime: number;
    duration: number;
    opacity: number;
    removeWhenInvisible: boolean;
    easingFunction: EasingFunction;
  };

  export type Gone = {
    type: AnimationType.Gone;
  };

  export type ScheduledForDeletion = {
    type: AnimationType.ScheduledForDeletion;
  };
}

type AnimationState =
  | Anim.Active
  | Anim.FadeOut
  | Anim.Gone
  | Anim.ScheduledForDeletion;

export interface Animation {
  animationState: AnimationState;
  update: (deltaTime: number) => boolean;
  draw: () => void;

  isFinished: () => boolean;
  temporary: boolean;

  fadeOut: (duration: number, f?: EasingFunction) => void;
  getContext(): CanvasRenderingContext2D;

  shouldDelete(): boolean;
}

export abstract class BaseAnimation implements Animation {
  readonly ctx: CanvasRenderingContext2D;
  temporary = false;
  animationState: AnimationState = { type: AnimationType.Active };
  onFinish?: () => void;

  protected abstract updateAnimation: (deltaTime: number) => boolean;
  abstract draw: () => void;
  abstract isFinished: () => boolean;

  constructor(ctx: CanvasRenderingContext2D) {
    this.ctx = ctx;
  }

  update = (deltaTime: number) => {
    switch (this.animationState.type) {
      case AnimationType.Active:
        break;
      case AnimationType.FadeOut: {
        this.animationState.elapsedTime += deltaTime;
        const t =
          this.animationState.elapsedTime / this.animationState.duration;
        this.animationState.opacity = Math.max(
          1 - this.animationState.easingFunction(t),
          0
        );

        if (this.animationState.opacity === 0) {
          this.animationState = this.animationState.removeWhenInvisible
            ? { type: AnimationType.ScheduledForDeletion }
            : { type: AnimationType.Gone };
        }

        break;
      }

      case AnimationType.Gone:
        return true;
    }
    const wasFinished = this.isFinished();
    const finished = this.updateAnimation(deltaTime);
    if (!wasFinished && finished) {
      this.onFinish?.();
    }

    this.draw();
    return finished;
  };

  fadeOut = (
    duration: number,
    f: EasingFunction = (x: number) => x,
    removeWhenInvisible = true
  ) => {
    if (this.animationState.type === AnimationType.Gone) return;

    this.animationState = {
      type: AnimationType.FadeOut,
      removeWhenInvisible,
      elapsedTime: 0,
      duration,
      opacity: 1,
      easingFunction: f
    };
  };

  shouldDelete = (): boolean => {
    return (
      this.animationState.type === AnimationType.ScheduledForDeletion ||
      (this.isFinished() && this.temporary)
    );
  };

  getContext = () => this.ctx;

  updateContext = () => {
    const oldOpacity = this.ctx.globalAlpha;

    switch (this.animationState.type) {
      case AnimationType.FadeOut:
        this.ctx.globalAlpha *= this.animationState.opacity;
    }

    return () => {
      this.ctx.globalAlpha = oldOpacity;
    };
  };

  stroke = () => {
    if (this.animationState.type === AnimationType.Gone) return;

    const resetContext = this.updateContext();
    this.ctx.stroke();
    resetContext();
  };

  fillRect = (x: number, y: number, w: number, h: number): void => {
    if (this.animationState.type === AnimationType.Gone) return;

    const resetContext = this.updateContext();
    this.ctx.fillRect(x, y, w, h);
    resetContext();
  };

  strokeRect = (x: number, y: number, w: number, h: number): void => {
    if (this.animationState.type === AnimationType.Gone) return;

    const resetContext = this.updateContext();
    this.ctx.strokeRect(x, y, w, h);
    resetContext();
  };
}

export class Parallel extends BaseAnimation {
  temporary = false;
  animations: Animation[];
  finished = false;
  constructor(...animations: Animation[]) {
    super(animations[0].getContext());

    this.animations = animations;
  }

  updateAnimation = (delta: number) => {
    if (this.animations.length === 0) return true;

    let allFinished = true;

    let i = 0;
    while (i < this.animations.length) {
      if (this.animations[i].shouldDelete()) {
        this.animations.splice(i, 1);
        continue;
      }

      const finished = this.animations[i].update(delta);
      allFinished = allFinished && finished;
      ++i;
    }

    // const wasFinished = this.finished;
    this.finished = allFinished;
    // if (!wasFinished && this.finished) {
    //   console.log("Parallel finished");
    // }

    return this.isFinished();
  };

  draw = () => {
    this.animations.forEach(a => a.draw());
  };

  isFinished = () => this.finished;
}

export class Sequential extends BaseAnimation {
  temporary = false;
  private animations: Animation[];
  finished = false;

  constructor(ctx: CanvasRenderingContext2D) {
    super(ctx);

    this.animations = [];
  }

  static create(...animations: Animation[]): Sequential {
    const result = new Sequential(animations[0].getContext());
    result.animations = animations;

    return result;
  }

  add = (animation: Animation) => {
    this.animations.push(animation);
  };

  updateAnimation = (delta: number) => {
    if (this.animations.length === 0) return true;

    let i = 0;
    while (i < this.animations.length) {
      if (this.animations[i].shouldDelete()) {
        this.animations.splice(i, 1);
        continue;
      }
      const finished = this.animations[i].update(delta);
      if (finished) {
        ++i;
      } else {
        this.finished = false;
        return this.isFinished();
      }
    }

    // const wasFinished = this.finished;
    this.finished = true;
    // if (!wasFinished && this.finished) {
    //   console.log("Sequential finished");
    // }
    return this.isFinished();
  };

  draw = () => {
    if (this.animations.length === 0) return;
    this.animations[0].draw();

    let i = 1;
    while (i < this.animations.length && this.animations[i].isFinished()) {
      this.animations[i].draw();
      ++i;
    }
  };

  isFinished = () => this.finished;
}
