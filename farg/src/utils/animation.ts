type Point2D = { x: number; y: number };

export interface Animation {
  update: (delta: number) => boolean;
  temporary: boolean;
}

class LineAnimation implements Animation {
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

  setTemporary = value => {
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
class Parallel implements Animation {
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

class Sequential implements Animation {
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

export { Parallel, Sequential, LineAnimation };
