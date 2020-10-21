import { ColorSample } from "./pixelator";

type EasingFunction = (t: number) => number;

export const easing = {
  easeOutCubic: (t: number) => --t * t * t + 1
};

export enum AnimationType {
  Active,
  FadeOut,
  Gone
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
    easingFunction: EasingFunction;
  };

  export type Gone = {
    type: AnimationType.Gone;
  };
}

type AnimationState = Anim.Active | Anim.FadeOut | Anim.Gone;

export interface Animation {
  animationState: AnimationState;
  update: (deltaTime: number) => boolean;
  draw: () => void;

  isFinished: () => boolean;
  temporary: boolean;

  fadeOut: (duration: number, f?: EasingFunction) => void;
  getContext(): CanvasRenderingContext2D;
}

abstract class BaseAnimation implements Animation {
  readonly ctx: CanvasRenderingContext2D;
  temporary = false;
  animationState: AnimationState = { type: AnimationType.Active };

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

        if (this.animationState.opacity === 0)
          this.animationState = { type: AnimationType.Gone };
        break;
      }

      case AnimationType.Gone:
        return true;
    }

    const finished = this.updateAnimation(deltaTime);
    this.draw();
    return finished;
  };

  fadeOut = (duration: number, f: EasingFunction = (x: number) => x) => {
    if (this.animationState.type === AnimationType.Gone) return;

    this.animationState = {
      type: AnimationType.FadeOut,
      elapsedTime: 0,
      duration,
      opacity: 1,
      easingFunction: f
    };
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

type Point2D = { x: number; y: number };

type PaletteAnimationConfig = {
  ctx: CanvasRenderingContext2D;
  swatch: ColorSample;
  topLeft: Point2D;
  boxSize: number;
  duration: number;
};

export class PaletteAnimation extends BaseAnimation {
  swatch: ColorSample;
  topLeft: Point2D;
  current: Point2D;
  boxSize: number;
  duration: number;
  finished: boolean;
  temporary: boolean;
  currentColorIndex: number;

  constructor({
    ctx,
    swatch,
    topLeft,
    boxSize,
    duration
  }: PaletteAnimationConfig) {
    super(ctx);

    this.swatch = swatch;
    this.topLeft = { ...topLeft };
    this.current = { ...topLeft };
    this.boxSize = boxSize;
    this.duration = duration;
    this.finished = false;
    this.temporary = false;
    this.currentColorIndex = Math.floor(
      Math.abs(this.current.x - this.topLeft.x) / this.boxSize
    );
  }

  setTemporary = (value: boolean) => (this.temporary = value);

  updateAnimation = (deltaTime: number) => {
    if (!deltaTime || deltaTime === 0) return false;

    if (!this.finished) {
      this.currentColorIndex = Math.floor(
        Math.abs(this.current.x - this.topLeft.x) / this.boxSize
      );
      const part = deltaTime / this.duration;
      this.current.x += this.swatch.palette.length * this.boxSize * part;
      if (this.currentColorIndex >= this.swatch.palette.length) {
        this.currentColorIndex = this.swatch.palette.length - 1;
        this.finished = true;
      }
    }

    return this.isFinished();
  };

  isFinished = () => this.finished;

  draw = () => {
    for (let i = 0; i < this.currentColorIndex + 1; i++) {
      this.ctx.fillStyle = this.swatch.palette[i];
      this.fillRect(
        this.topLeft.x + this.boxSize * i,
        this.topLeft.y,
        this.boxSize,
        this.boxSize
      );
    }
  };
}

function normalize(x: number, min: number, max: number) {
  return (x - min) / (max - min);
}

function denormalize(x: number, min: number, max: number) {
  return min + (max - min) * x;
}

const interpolate = (
  f: (x: number) => number,
  range: { from: number; to: number }
) => (x: number) => {
  const result = f(normalize(x, range.from, range.to));
  return denormalize(result, range.from, range.to);
};

type HighlightPaletteAnimationConfig = {
  animation: PaletteAnimation;
  duration: number;
  easingFunction?: (x: number) => number;
};

enum HighlightPatternState {
  Cycling,
  Blinking,
  Focus
}

class HighlightPaletteAnimation extends BaseAnimation {
  readonly animation: PaletteAnimation;
  LoopCount = 2;

  xOffset = 0;

  state: { state: HighlightPatternState; elapsedTime: number } = {
    state: HighlightPatternState.Cycling,
    elapsedTime: 0
  };

  readonly finalIndex: number;

  elapsedTime = 0;
  currentIndex = 0;
  boxOpacity = 1;
  increasingOpacity = false;

  temporary = false;

  cycleDurationMs: number;
  totalDurationMs: number;

  readonly FadeOutInDurationMs = 250;
  readonly BlinkAmount = 3;

  readonly BlinkDurationMs = this.FadeOutInDurationMs * this.BlinkAmount;
  readonly FocusDurationMs = 1000;

  easingFunction: (x: number) => number;

  constructor({
    animation,
    duration,
    easingFunction
  }: HighlightPaletteAnimationConfig) {
    super(animation.ctx);

    this.cycleDurationMs =
      duration - this.BlinkDurationMs - this.FadeOutInDurationMs;

    this.totalDurationMs =
      this.cycleDurationMs + this.BlinkDurationMs + this.FocusDurationMs;

    this.animation = animation;

    const prominentIndex = animation.swatch.palette.findIndex(
      color => color === animation.swatch.prominentColor
    );
    this.finalIndex =
      this.LoopCount * animation.swatch.palette.length + prominentIndex;

    this.easingFunction = easingFunction ?? ((t: number) => t);
  }

  updateAnimation = (deltaTime: number) => {
    if (!deltaTime || deltaTime === 0) return false;

    if (!this.animation.updateAnimation(deltaTime)) return false;

    this.elapsedTime = Math.min(
      this.elapsedTime + deltaTime,
      this.totalDurationMs
    );

    this.state.elapsedTime += deltaTime;

    const t = Math.min(this.elapsedTime / this.cycleDurationMs, 1);
    this.currentIndex = Math.round(this.easingFunction(t) * this.finalIndex);
    const highlightIndex =
      this.currentIndex % this.animation.swatch.palette.length;

    this.xOffset = highlightIndex * this.animation.boxSize;

    switch (this.state.state) {
      case HighlightPatternState.Cycling:
        if (this.state.elapsedTime >= this.cycleDurationMs)
          this.state = {
            state: HighlightPatternState.Blinking,
            elapsedTime: 0
          };
        break;

      case HighlightPatternState.Blinking: {
        this.updateOpacity(deltaTime);
        if (this.state.elapsedTime >= this.BlinkDurationMs) {
          this.state = {
            state: HighlightPatternState.Focus,
            elapsedTime: 0
          };
          this.animation.fadeOut(1000, easing.easeOutCubic);
        }
        break;
      }
    }

    return this.isFinished();
  };

  draw = () => {
    this.animation.draw();
    if (!this.animation.isFinished()) return;

    if (this.state.state === HighlightPatternState.Focus) {
      const oldFillStyle = this.ctx.fillStyle;
      this.ctx.fillStyle = this.animation.swatch.prominentColor;
      this.fillRect(
        this.animation.topLeft.x + this.xOffset,
        this.animation.topLeft.y,
        this.animation.boxSize,
        this.animation.boxSize
      );
      this.ctx.fillStyle = oldFillStyle;
    }

    const oldOpacity = this.ctx.globalAlpha;
    const oldWidth = this.ctx.lineWidth;

    if (this.state.state === HighlightPatternState.Blinking) {
      this.ctx.globalAlpha = this.boxOpacity;
    }

    this.ctx.save();
    this.ctx.lineWidth = 5;
    this.strokeRect(
      this.animation.topLeft.x + this.xOffset,
      this.animation.topLeft.y,
      this.animation.boxSize,
      this.animation.boxSize
    );
    this.ctx.restore();

    this.ctx.globalAlpha = oldOpacity;
    this.ctx.lineWidth = oldWidth;
  };

  updateOpacity = (deltaTime: number) => {
    const deltaOpacity = deltaTime / 6 / 50;
    if (this.increasingOpacity) {
      this.boxOpacity += deltaOpacity;

      if (this.boxOpacity > 1) {
        this.boxOpacity = 1;
        this.increasingOpacity = false;
      }
    } else {
      this.boxOpacity -= deltaOpacity;

      if (this.boxOpacity < 0) {
        this.boxOpacity = 0;
        this.increasingOpacity = true;
      }
    }
  };

  isFinished = (): boolean => {
    return (
      this.state.state === HighlightPatternState.Focus &&
      this.state.elapsedTime >= this.FocusDurationMs
    );
  };
}

export class LineAnimation extends BaseAnimation {
  from: Point2D;
  to: Point2D;
  current: Point2D;
  duration: number;
  abs: Point2D;
  temporary = false;
  finished: boolean;

  constructor(
    ctx: CanvasRenderingContext2D,
    from: Point2D,
    to: Point2D,
    duration: number
  ) {
    super(ctx);

    this.from = { ...from };
    this.to = { ...to };
    this.current = { ...from };
    this.duration = duration;
    this.abs = { x: Math.abs(to.x - from.x), y: Math.abs(to.y - from.y) };
    this.temporary = false;
    this.finished = false;
  }

  setTemporary = (value: boolean) => {
    this.temporary = value;
  };

  updateAnimation = (delta: number) => {
    if (!delta || delta === 0) return false;

    if (!this.finished) {
      const part = delta / this.duration;
      this.current.x += (this.to.x - this.from.x) * part;
      this.current.y += (this.to.y - this.from.y) * part;
      if (
        this.abs.x <= Math.abs(this.current.x - this.from.x) &&
        this.abs.y <= Math.abs(this.current.y - this.from.y)
      ) {
        this.current = this.to;
        // console.log("LineAnimation finished");
        this.finished = true;
      }
    }

    return this.isFinished();
  };

  draw = () => {
    this.ctx.beginPath();
    this.ctx.moveTo(this.from.x, this.from.y);
    this.ctx.lineTo(this.current.x, this.current.y);
    this.stroke();
  };

  isFinished = () => this.finished;
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
      const finished = this.animations[i].update(delta);
      if (finished && this.animations[i].temporary) {
        this.animations.splice(i, 1);
      } else {
        allFinished = allFinished && finished;
        ++i;
      }
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
  animations: Animation[];
  finished = false;

  constructor(...animations: Animation[]) {
    super(animations[0].getContext());

    this.animations = animations;
  }

  add = (animation: Animation) => {
    this.animations.push(animation);
  };

  updateAnimation = (delta: number) => {
    if (this.animations.length === 0) return true;

    let i = 0;
    while (i < this.animations.length) {
      if (this.animations[i].update(delta)) {
        if (this.animations[i].temporary) {
          this.animations.splice(i, 1);
        } else {
          ++i;
        }
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

export const highlightPalette = (config: HighlightPaletteAnimationConfig) =>
  new HighlightPaletteAnimation(config);
