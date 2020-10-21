function getCenter(points) {
  let center = {
    x: 0,
    y: 0
  }
  points.forEach((p) => {
    center.x += p.x;
    center.y += p.y;
  })
  return {
    x: center.x / points.length,
    y: center.y / points.length
  }
}

function clockwise(points) {
  let ps = []
  let center = getCenter(points)
  points.forEach((p) => {
    ps.push({
      a: Math.atan2(p.y - center.y, p.x - center.x),
      x: p.x,
      y: p.y
    })
  })
  ps.sort((p1, p2) => {
    return p1.a - p2.a
  })
  return ps
}


// TOOD keep track of all found points
// when new one is found expand the blob to there smoothly + reverse
class Blob {
  constructor(points) {
    this.points = points
  }

  render(ctx, color, offset, mode) {

    ctx.save();
    ctx.globalCompositeOperation = mode;
    ctx.translate(offset.x, offset.y)
    // let canvas = this.canvas;
    // let ctx = this.ctx;
    let center = getCenter(this.points);
    // this.points.forEach((point) => {
    //   let v = {
    //     x: center.x - point.x,
    //     y: center.y - point.y
    //   }
    //   point.x -= v.x
    //   point.y -= v.y
    // })
    let pointsArray = this.points // clockwise(this.points); //

    let p0 = pointsArray[0];
    let p1 = pointsArray[0];
    let _p2 = p1;

    ctx.beginPath();
    ctx.moveTo((p0.x + p1.x) / 2, (p0.y + p1.y) / 2);

    for (let i = 1; i < pointsArray.length; i++) {
      let p2 = pointsArray[i];
      var xc = (p1.x + p2.x) / 2;
      var yc = (p1.y + p2.y) / 2;
      ctx.quadraticCurveTo(p1.x, p1.y, xc, yc);
      p1 = p2;
    }

    var xc = (p1.x + _p2.x) / 2;
    var yc = (p1.y + _p2.y) / 2;
    ctx.quadraticCurveTo(p1.x, p1.y, xc, yc);


    ctx.closePath();
    ctx.strokeStyle = color;
    ctx.lineWidth = 10;
    ctx.stroke();
    ctx.restore()


    this.points.forEach((point) => {
      ctx.beginPath();
      ctx.rect(point.x - 10, point.y - 10, 20, 20);
      ctx.fillStyle = "pink";
      ctx.fill();
    })





    // ctx.beginPath();
    // ctx.rect(center.x - 10, center.y - 10, 20, 20);
    // ctx.fillStyle = "pink";
    // ctx.fill();

  }
}

export { Blob }
