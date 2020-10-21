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

type HighlightPaletteAnimationConfig = {
  animation: PaletteAnimation;
  duration: number;
  blinkPercentage: number;
  easingFunction?: (x: number) => number;
};

class HighlightPaletteAnimation implements Animation {
  animation: PaletteAnimation;
  ctx: CanvasRenderingContext2D;
  LoopCount = 2;

  cycleDuration: number;
  totalDuration: number;
  finalIndex: number;

  elapsedTime = 0;
  currentIndex = 0;
  boxOpacity = 1;
  increasingOpacity = false;

  temporary = false;

  DefaultChangeDeltaMs = 500;

  easingFunction: (x: number) => number;

  constructor({
    animation,
    duration,
    blinkPercentage = 20,
    easingFunction
  }: HighlightPaletteAnimationConfig) {
    this.animation = animation;
    this.totalDuration = duration;
    this.cycleDuration = duration * (1 - blinkPercentage / 100);

    const prominentIndex = animation.swatch.palette.findIndex(
      color => color === animation.swatch.prominentColor
    );
    this.finalIndex =
      this.LoopCount * animation.swatch.palette.length + prominentIndex;

    this.easingFunction = easingFunction ?? ((t: number) => t);
    this.ctx = animation.ctx;
  }

  draw = (x: number) => {
    this.ctx.strokeRect(
      this.animation.topLeft.x + x,
      this.animation.topLeft.y,
      this.animation.boxSize,
      this.animation.boxSize
    );
  };

  update = (deltaTime: number) => {
    if (!deltaTime || deltaTime === 0) return false;

    if (!this.animation.update(deltaTime)) return false;

    this.elapsedTime = Math.min(
      this.elapsedTime + deltaTime,
      this.totalDuration
    );

    const t = this.elapsedTime / this.cycleDuration;
    this.currentIndex = Math.round(this.easingFunction(t) * this.finalIndex);
    const highlightIndex =
      this.currentIndex % this.animation.swatch.palette.length;

    const x = highlightIndex * this.animation.boxSize;

    // Blink
    if (
      this.cycleDuration <= this.elapsedTime &&
      this.elapsedTime <= this.totalDuration
    ) {
      const oldOpacity = this.ctx.globalAlpha;

      this.updateOpacity(deltaTime);

      this.ctx.globalAlpha = this.boxOpacity;
      this.draw(x);
      this.ctx.globalAlpha = oldOpacity;
    } else {
      this.draw(x);
    }

    return this.elapsedTime >= this.totalDuration;
  };

  updateOpacity = (deltaTime: number) => {
    const deltaOpacity = deltaTime / 6;
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

export const highlightPalette = (config: HighlightPaletteAnimationConfig) =>
  new HighlightPaletteAnimation(config);
