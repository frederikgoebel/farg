import { ColorSample } from "./pixelator";

export interface Animation {
  update: (delta: number) => boolean;
  temporary: boolean;
}
type Point2D = { x: number; y: number };

type PaletteAnimationConfig = {
  ctx: CanvasRenderingContext2D;
  swatch: ColorSample;
  topLeft: Point2D;
  boxSize: number;
  duration: number;
};

export class PaletteAnimation implements Animation {
  ctx: CanvasRenderingContext2D;
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
    this.ctx = ctx;
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

  update = (delta: number) => {
    if (!delta || delta === 0) return false;

    if (!this.finished) {
      this.currentColorIndex = Math.floor(
        Math.abs(this.current.x - this.topLeft.x) / this.boxSize
      );
      const part = delta / this.duration;
      this.current.x += this.swatch.palette.length * this.boxSize * part;
      if (this.currentColorIndex >= this.swatch.palette.length) {
        this.currentColorIndex = this.swatch.palette.length - 1;
        this.finished = true;
      }
    }

    for (let i = 0; i < this.currentColorIndex + 1; i++) {
      this.ctx.fillStyle = this.swatch.palette[i];
      this.ctx.fillRect(
        this.topLeft.x + this.boxSize * i,
        this.topLeft.y,
        this.boxSize,
        this.boxSize
      );
    }

    return this.finished;
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

class HighlightPaletteAnimation implements Animation {
  animation: PaletteAnimation;
  ctx: CanvasRenderingContext2D;
  LoopCount = 2;
  duration: number;
  bufferedTime = 0;
  elapsedTime = 0;

  currentIndex = 0;
  finalIndex: number;

  temporary = false;

  DefaultChangeDeltaMs = 500;

  easingFunction: (x: number) => number;

  constructor(
    animation: PaletteAnimation,
    duration: number,
    easingFunction?: (x: number) => number
  ) {
    this.animation = animation;
    const prominentIndex = animation.swatch.palette.findIndex(
      color => color === animation.swatch.prominentColor
    );
    this.finalIndex = this.LoopCount * 2 + prominentIndex;

    this.easingFunction = easingFunction ?? (() => this.DefaultChangeDeltaMs);
    this.ctx = animation.ctx;
    this.duration = duration;
  }

  update = (deltaTime: number) => {
    if (!deltaTime || deltaTime === 0) return false;

    if (!this.animation.update(deltaTime)) return false;

    this.bufferedTime += deltaTime;
    this.elapsedTime = Math.min(this.elapsedTime + deltaTime, this.duration);

    const t = this.elapsedTime / this.duration;
    this.currentIndex = Math.round(this.easingFunction(t) * this.finalIndex);
    const highlightIndex =
      this.currentIndex % this.animation.swatch.palette.length;

    const x = highlightIndex * this.animation.boxSize;
    const topLeft = this.animation.topLeft;

    this.ctx.strokeStyle = "green";
    this.ctx.strokeRect(
      topLeft.x + x,
      topLeft.y,
      this.animation.boxSize,
      this.animation.boxSize
    );

    return this.elapsedTime >= this.duration;
  };
}

export class LineAnimation implements Animation {
  ctx: CanvasRenderingContext2D;
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
    this.ctx = ctx;
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

  update = (delta: number) => {
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
        this.finished = true;
      }
    }

    this.ctx.beginPath();
    this.ctx.moveTo(this.from.x, this.from.y);
    this.ctx.lineTo(this.current.x, this.current.y);
    this.ctx.stroke();

    return this.finished;
  };
}
export class Parallel implements Animation {
  temporary = false;
  animations: Animation[];
  constructor(...animations: Animation[]) {
    this.animations = animations;
  }

  update = (delta: number) => {
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

    return allFinished;
  };
}

export class Sequential implements Animation {
  temporary = false;
  animations: Animation[];

  constructor(...animations: Animation[]) {
    this.animations = animations;
  }

  add = (animation: Animation) => {
    this.animations.push(animation);
  };

  update = (delta: number) => {
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
        return false;
      }
    }

    return true;
  };
}

export const easing = {
  easeOutCubic: (t: number) => --t * t * t + 1
};

export const highlightPalette = (
  animation: PaletteAnimation,
  duration: number,
  easingFunction?: (x: number) => number
) => new HighlightPaletteAnimation(animation, duration, easingFunction);
