import { BaseAnimation, Point2D } from "./animation";
import { ColorSample } from "../pixelator";
import easing from "./easing";

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
    this.temporary = false;
    this.currentColorIndex = Math.floor(
      Math.abs(this.current.x - this.topLeft.x) / this.boxSize
    );
  }

  setTemporary = (value: boolean) => (this.temporary = value);

  updateAnimation = (deltaTime: number) => {
    if (!deltaTime || deltaTime === 0) return false;
    if (this.isFinished()) return true;

    this.currentColorIndex = Math.floor(
      Math.abs(this.current.x - this.topLeft.x) / this.boxSize
    );
    const part = deltaTime / this.duration;
    this.current.x += this.swatch.palette.length * this.boxSize * part;
    if (this.currentColorIndex >= this.swatch.palette.length) {
      this.currentColorIndex = this.swatch.palette.length - 1;
      this.setFinished(true);
    }

    return this.isFinished();
  };

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

export class HighlightPaletteAnimation extends BaseAnimation {
  readonly animation: PaletteAnimation;
  private LoopCount = 2;

  xOffset = 0;

  private state: { state: HighlightPatternState; elapsedTime: number } = {
    state: HighlightPatternState.Cycling,
    elapsedTime: 0
  };

  private readonly finalIndex: number;

  elapsedTime = 0;
  private currentIndex = 0;
  private boxOpacity = 1;
  private increasingOpacity = false;

  temporary = false;

  private cycleDurationMs: number;
  private totalDurationMs: number;

  private readonly FadeOutInDurationMs = 250;
  private readonly BlinkAmount = 3;

  private readonly BlinkDurationMs =
    this.FadeOutInDurationMs * this.BlinkAmount;
  private readonly FocusDurationMs = 1000;

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

    this.animation.update(deltaTime);
    if (!this.animation.isFinished()) return false;
    if (this.isFinished()) return true;

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
      case HighlightPatternState.Focus:
        if (this.state.elapsedTime >= this.FocusDurationMs) {
          this.setFinished(true);
        }
    }

    return this.isFinished();
  };

  draw = () => {
    this.animation.render();
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

  highlightPosition = (): Point2D => {
    const pos = { ...this.animation.topLeft };
    pos.x += this.xOffset;
    return pos;
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
}

export const highlightPalette = (config: HighlightPaletteAnimationConfig) =>
  new HighlightPaletteAnimation(config);
