import { EasingFunction } from "./easing";

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
  render: () => void;

  isFinished: () => boolean;
  temporary: boolean;

  fadeOut: (duration: number, f?: EasingFunction) => void;
  getContext(): CanvasRenderingContext2D;

  shouldDelete(): boolean;

  identifier: string;
  setName: (name: string) => void;
}

export abstract class BaseAnimation implements Animation {
  identifier = "N/A";
  readonly ctx: CanvasRenderingContext2D;
  temporary = false;
  animationState: AnimationState = { type: AnimationType.Active };
  private finished = false;
  onFinish?: () => void;

  protected abstract updateAnimation: (deltaTime: number) => boolean;
  protected abstract draw: () => void;
  isFinished = (): boolean => this.finished;
  setFinished = (finished: boolean): void => {
    if (this.finished && !finished) {
      console.warn("this.finished was true, but setting it back to false?");
    }

    // if (!this.finished && finished) {
    //   if (this.identifier === "N/A") {
    //     console.log(this);
    //   }
    //   console.log("Animation " + this.identifier + " finished.");
    // }

    this.finished = finished;
  };

  constructor(ctx: CanvasRenderingContext2D) {
    this.ctx = ctx;
  }

  setName = (name: string) => {
    this.identifier = name;
  };

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
      case AnimationType.ScheduledForDeletion:
        return true;
    }
    const wasFinished = this.isFinished();
    const finished = this.updateAnimation(deltaTime);
    if (!wasFinished && finished) {
      this.onFinish?.();
    }

    return finished;
  };

  render = () => {
    if (!this.shouldDraw()) return;

    this.draw();
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
    const result =
      this.animationState.type === AnimationType.ScheduledForDeletion ||
      (this.isFinished() && this.temporary);

    return result;
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

  shouldDraw = (): boolean => {
    const state = this.animationState;

    switch (state.type) {
      case AnimationType.Gone:
      case AnimationType.ScheduledForDeletion:
        return false;
      case AnimationType.FadeOut:
        if (state.opacity === 0) return false;
        break;
      default:
        break;
    }

    return true;
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
  animations: Animation[];
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

    this.setFinished(allFinished);
    return this.isFinished();
  };

  draw = () => {
    this.animations.forEach(a => a.render());
  };
}

export abstract class BaseSequential<
  A extends Animation = Animation
> extends BaseAnimation {
  abstract size(): number;
  abstract removeAtIndex(index: number): void;
  abstract get(index: number): A;
  abstract add(animation: A): void;
  empty = (): boolean => this.size() === 0;

  constructor(ctx: CanvasRenderingContext2D) {
    super(ctx);
  }

  updateAnimation = (delta: number) => {
    const { size, get, removeAtIndex, setFinished, isFinished } = this;
    if (size() === 0) return true;

    let i = 0;
    while (i < size()) {
      const animation = get(i);
      if (animation.shouldDelete()) {
        removeAtIndex(i);
        continue;
      }
      const finished = animation.update(delta);
      if (finished) {
        ++i;
      } else {
        setFinished(false);
        return isFinished();
      }
    }

    setFinished(true);
    return isFinished();
  };

  draw = () => {
    const { empty, size, get } = this;
    if (empty()) return;

    let done = false;
    let i = 0;
    while (!done) {
      const animation = get(i);
      animation.render();
      ++i;
      done = !animation.isFinished() || i == size();
    }
  };
}

export class Sequential extends BaseSequential {
  private animations: Animation[];

  constructor(ctx: CanvasRenderingContext2D) {
    super(ctx);

    this.animations = [];
  }

  size = (): number => this.animations.length;

  removeAtIndex = (index: number): void => {
    this.animations.splice(index, 1);
  };

  get = (index: number): Animation => {
    return this.animations[index];
  };

  add = (animation: Animation): void => {
    this.animations.push(animation);
  };

  static create(...animations: Animation[]): Sequential {
    const result = new Sequential(animations[0].getContext());
    result.animations = animations;

    return result;
  }
}
