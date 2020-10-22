import { BaseAnimation, Point2D } from "./animation";

export class LineAnimation extends BaseAnimation {
  from: Point2D;
  to: Point2D;
  current: Point2D;
  duration: number;
  abs: Point2D;

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
  }

  setTemporary = (value: boolean) => {
    this.temporary = value;
  };

  updateAnimation = (delta: number) => {
    if (!delta || delta === 0) return false;
    if (this.isFinished()) return true;

    const part = delta / this.duration;
    this.current.x += (this.to.x - this.from.x) * part;
    this.current.y += (this.to.y - this.from.y) * part;
    if (
      this.abs.x <= Math.abs(this.current.x - this.from.x) &&
      this.abs.y <= Math.abs(this.current.y - this.from.y)
    ) {
      this.current = this.to;
      // console.log("LineAnimation finished");
      this.setFinished(true);
    }

    return this.isFinished();
  };

  draw = () => {
    this.ctx.beginPath();
    this.ctx.moveTo(this.from.x, this.from.y);
    this.ctx.lineTo(this.current.x, this.current.y);
    this.stroke();
  };
}
