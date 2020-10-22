import { BaseAnimation, Point2D, Sequential } from "./animation";
import { EasingFunction, denormalize } from "./easing";

type AnimationThunk = (rectangle: Rectangle) => RectangleAnimation;

type Size = {
  width: number;
  height: number;
};

interface RectangleAnimationArgs {
  ctx: CanvasRenderingContext2D;
  rectangle: Rectangle;
  duration: number;
  easingFunction?: EasingFunction;
}

abstract class RectangleAnimation extends BaseAnimation {
  rectangle: Rectangle;
  duration: number;
  protected elapsedTime = 0;
  protected easingFunction: EasingFunction = (t: number) => t;

  constructor({
    ctx,
    rectangle,
    duration,
    easingFunction
  }: RectangleAnimationArgs) {
    super(ctx);

    this.rectangle = rectangle;
    this.duration = duration;

    if (easingFunction) this.easingFunction = easingFunction;
  }

  draw = () => {
    this.ctx.save();
    this.ctx.fillStyle = this.rectangle.color;
    this.fillRect(
      this.rectangle.x,
      this.rectangle.y,
      this.rectangle.width,
      this.rectangle.height
    );
    this.ctx.restore();
  };

  isFinished = (): boolean => {
    return this.elapsedTime >= this.duration;
  };
}

export default class Rectangle {
  x: number;
  y: number;
  width: number;
  height: number;
  color: string;

  constructor(color: string, x = 0, y = 0, width = 0, height = 0) {
    this.color = color;
    this.x = x;
    this.y = y;
    this.width = width;
    this.height = height;
  }

  static scale({
    ctx,
    duration,
    size,
    easingFunction
  }: {
    ctx: CanvasRenderingContext2D;
    duration: number;
    size: Size;
    easingFunction?: EasingFunction;
  }): RectangleAnimations {
    const thunk: AnimationThunk = rectangle => {
      // eslint-disable-next-line @typescript-eslint/no-use-before-define
      return new Scale({
        ctx,
        rectangle,
        duration,
        toSize: size,
        easingFunction
      });
    };

    // eslint-disable-next-line @typescript-eslint/no-use-before-define
    return new RectangleAnimations(ctx, thunk);
  }

  static translate(
    ctx: CanvasRenderingContext2D,
    duration: number,
    to: Point2D
  ): RectangleAnimations {
    const thunk: AnimationThunk = rectangle => {
      // eslint-disable-next-line @typescript-eslint/no-use-before-define
      return new Translate({
        ctx,
        rectangle,
        duration,
        to
      });
    };
    // eslint-disable-next-line @typescript-eslint/no-use-before-define
    return new RectangleAnimations(ctx, thunk);
  }

  scale = (
    ctx: CanvasRenderingContext2D,
    duration: number,
    size: Size
  ): RectangleAnimations => {
    const thunk: AnimationThunk = rectangle => {
      // eslint-disable-next-line @typescript-eslint/no-use-before-define
      return new Scale({
        ctx,
        rectangle,
        duration,
        toSize: size
      });
    };

    // eslint-disable-next-line @typescript-eslint/no-use-before-define
    return new RectangleAnimations(ctx, thunk, this);
  };

  translate = (
    ctx: CanvasRenderingContext2D,
    duration: number,
    to: Point2D
  ): RectangleAnimations => {
    const thunk: AnimationThunk = rectangle => {
      // eslint-disable-next-line @typescript-eslint/no-use-before-define
      return new Translate({
        ctx,
        rectangle,
        duration,
        to
      });
    };
    // eslint-disable-next-line @typescript-eslint/no-use-before-define
    return new RectangleAnimations(ctx, thunk, this);
  };
}

interface ScaleArgs extends RectangleAnimationArgs {
  toSize: Size;
}
export class Scale extends RectangleAnimation {
  fromSize: Size;
  toSize: Size;
  center: Point2D;

  constructor({ ctx, toSize, duration, rectangle, easingFunction }: ScaleArgs) {
    super({ ctx, rectangle, duration, easingFunction });

    this.duration = duration;
    this.toSize = toSize;
    this.rectangle = rectangle;

    this.fromSize = {
      width: this.rectangle.width,
      height: this.rectangle.height
    };

    this.center = {
      x: this.rectangle.x + this.rectangle.width / 2,
      y: this.rectangle.y + this.rectangle.height / 2
    };
  }

  updateAnimation = (deltaTime: number): boolean => {
    if (this.elapsedTime === this.duration) return true;

    this.elapsedTime = Math.min(this.elapsedTime + deltaTime, this.duration);

    const t = this.easingFunction(this.elapsedTime / this.duration);
    const width = denormalize(t, this.fromSize.width, this.toSize.width);
    const height = denormalize(t, this.fromSize.height, this.toSize.height);

    const deltaWidth = width - this.rectangle.width;
    this.rectangle.x -= deltaWidth / 2;

    const deltaHeight = height - this.rectangle.height;
    this.rectangle.y -= deltaHeight / 2;

    this.rectangle.width = width;
    this.rectangle.height = height;

    return false;
  };
}

interface TranslateArgs extends RectangleAnimationArgs {
  to: Point2D;
}
export class Translate extends RectangleAnimation {
  from: Point2D;
  to: Point2D;

  constructor({ ctx, duration, to, rectangle, easingFunction }: TranslateArgs) {
    super({ ctx, rectangle, duration, easingFunction });

    this.duration = duration;
    this.to = to;

    this.from = {
      x: this.rectangle.x,
      y: this.rectangle.y
    };
  }

  updateAnimation = (deltaTime: number): boolean => {
    if (this.elapsedTime === this.duration) return true;

    this.elapsedTime = Math.min(this.elapsedTime + deltaTime, this.duration);

    const t = this.easingFunction(this.elapsedTime / this.duration);
    const x = denormalize(t, this.from.x, this.to.x);
    const y = denormalize(t, this.from.y, this.to.y);

    this.rectangle.x = x;
    this.rectangle.y = y;

    return false;
  };
}

class RectangleAnimations extends Sequential {
  private animationThunks: AnimationThunk[] = [];
  private rectangle?: Rectangle;
  constructor(
    ctx: CanvasRenderingContext2D,
    thunk: AnimationThunk,
    rectangle?: Rectangle
  ) {
    super(ctx);
    this.rectangle = rectangle;

    this.addThunk(thunk);
  }

  /**
    Run the thunks, populating the sequential with animations stored in the thunks.
  */
  materialize = () => {
    if (this.animationThunks.length !== 0) {
      this.runThunks();
    }
  };

  private runThunks = (): void => {
    if (this.rectangle === undefined) {
      console.warn(
        "[RectangleAnimations] Attempted to update without a rectangle."
      );
      return;
    }

    this.animationThunks.forEach(createAnimation =>
      this.add(createAnimation(this.rectangle as Rectangle))
    );

    this.animationThunks = [];
  };

  setRectangle = (rectangle: Rectangle) => {
    const rect = { ...rectangle };
    this.rectangle = rect;
  };

  private addThunk = (thunk: AnimationThunk) => {
    this.animationThunks.push(thunk);
  };

  scale = ({
    duration,
    size,
    easingFunction
  }: {
    duration: number;
    size: Size;
    easingFunction?: EasingFunction;
  }): RectangleAnimations => {
    this.addThunk(
      rectangle =>
        new Scale({
          ctx: this.ctx,
          rectangle,
          duration,
          toSize: size,
          easingFunction
        })
    );

    return this;
  };

  translate = ({
    duration,
    to,
    easingFunction
  }: {
    duration: number;
    to: Point2D;
    easingFunction?: EasingFunction;
  }): RectangleAnimations => {
    this.addThunk(
      rectangle =>
        new Translate({
          ctx: this.ctx,
          rectangle,
          duration,
          to,
          easingFunction
        })
    );

    return this;
  };
}