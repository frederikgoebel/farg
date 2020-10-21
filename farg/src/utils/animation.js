class LineAnimation {
  constructor(ctx, from, to, duration) {
    this.ctx = ctx;
    this.from = { ...from };
    this.to = { ...to };
    this.current = { ...from };
    this.duration = duration;
    this.abs = { x: Math.abs(to.x - from.x), y: Math.abs(to.y - from.y) };
    this.temporary = false;
    this.finished = false;
  }

  setTemporary = (value) => {
    this.temporary = value;
  };

  update = (delta) => {
    if (!delta) return;
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
class Parallel {
  constructor(...animations) {
    this.animations = animations;
  }

  update = (delta) => {
    if (this.animations.length === 0) return true;

    let allFinished = true;

    let i = 0;
    while (i < this.animations.length) {
      const finished = this.animations[i].update(delta);
      if (finished && this.animations[i].temporary) {
        this.animations.splice(i, 1);
      } else {
        allFinished &= finished;
        ++i;
      }
    }

    return allFinished;
  };
}

class Sequential {
  constructor(...animations) {
    this.animations = animations;
  }

  add = (animation) => {
    this.animations.add(animation);
  };

  update = (delta) => {
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
