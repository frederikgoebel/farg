import { BaseAnimation, Point2D, BaseSequential, Animation } from "./animation";
import { EasingFunction, denormalize } from "./easing";

type RectangleThunk = (rectangle: Rectangle) => RectangleAnimation;

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
    easingFunction,
    name
  }: {
    ctx: CanvasRenderingContext2D;
    duration: number;
    size: Size;
    easingFunction?: EasingFunction;
    name?: string;
  }): RectangleAnimations {
    const thunk: RectangleThunk = rectangle => {
      // eslint-disable-next-line @typescript-eslint/no-use-before-define
      const animation = new Scale({
        ctx,
        rectangle,
        duration,
        toSize: size,
        easingFunction
      });
      if (name) {
        animation.setName(name);
      }

      return animation;
    };

    // eslint-disable-next-line @typescript-eslint/no-use-before-define
    return new RectangleAnimations(ctx, thunk);
  }

  static translate(
    ctx: CanvasRenderingContext2D,
    duration: number,
    to: Point2D
  ): RectangleAnimations {
    const thunk: RectangleThunk = rectangle => {
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
    const thunk: RectangleThunk = rectangle => {
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
    const thunk: RectangleThunk = rectangle => {
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
  toSize: Size;
  fromSize: Size;

  constructor({ ctx, toSize, duration, rectangle, easingFunction }: ScaleArgs) {
    super({ ctx, rectangle, duration, easingFunction });

    this.duration = duration;
    this.toSize = toSize;
    this.rectangle = rectangle;

    this.fromSize = {
      width: this.rectangle.width,
      height: this.rectangle.height
    };
  }

  updateAnimation = (deltaTime: number): boolean => {
    if (this.isFinished()) return true;

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

    if (this.elapsedTime >= this.duration) {
      this.setFinished(true);
    }

    return this.isFinished();
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
    this.from = {
      x: this.rectangle.x,
      y: this.rectangle.y
    };
    this.to = to;
  }

  updateAnimation = (deltaTime: number): boolean => {
    if (this.isFinished()) return true;

    this.elapsedTime = Math.min(this.elapsedTime + deltaTime, this.duration);

    const t = this.easingFunction(this.elapsedTime / this.duration);
    const x = denormalize(t, this.from.x, this.to.x);
    const y = denormalize(t, this.from.y, this.to.y);

    this.rectangle.x = x;
    this.rectangle.y = y;

    if (this.elapsedTime >= this.duration) {
      this.setFinished(true);
    }

    return this.isFinished();
  };
}

class RectangleAnimations extends BaseSequential {
  private animations: Animation[] = [];
  private animationThunks: RectangleThunk[] = [];

  private rectangle?: Rectangle;
  constructor(
    ctx: CanvasRenderingContext2D,
    thunk: RectangleThunk,
    rectangle?: Rectangle
  ) {
    super(ctx);
    this.rectangle = rectangle;

    this.addThunk(thunk);
  }

  size = (): number => this.animations.length + this.animationThunks.length;

  removeAtIndex = (index: number): void => {
    this.animations.splice(index, 1);
  };

  get = (index: number): Animation => {
    while (index >= this.animations.length) {
      this.materializeThunk();
    }
    return this.animations[index];
  };

  add = (animation: Animation): void => {
    this.animations.push(animation);
  };

  private materializeThunk = () => {
    this.add(this.animationThunks[0](this.rectangle as Rectangle));
    this.animationThunks.splice(0, 1);
  };

  setRectangle = (rectangle: Rectangle) => {
    const rect = { ...rectangle };
    this.rectangle = rect;
  };

  private addThunk = (thunk: RectangleThunk) => {
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
    easingFunction,
    name
  }: {
    duration: number;
    to: Point2D;
    easingFunction?: EasingFunction;
    name?: string;
  }): RectangleAnimations => {
    this.addThunk(rectangle => {
      const animation = new Translate({
        ctx: this.ctx,
        rectangle,
        duration,
        to,
        easingFunction
      });
      if (name) animation.setName(name);
      return animation;
    });

    return this;
  };
}
