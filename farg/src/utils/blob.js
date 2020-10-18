import Victor from 'victor'

let canvas,
  ctx;
let render,
  init;
let blob;


function getVector(p1, p2) {
  return {
    x: p1.x - p2.x,
    y: p1.y - p2.y
  }
}

function drawEyeLine(leftEye, rightEye) {
  let le = new Victor(leftEye.position.x, leftEye.position.y);
  let re = new Victor(rightEye.position.x, rightEye.position.y);
  let v = le.subtract(re);
  let scale = v.length / 4 * 3;
}

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
    ps.sort((p1, p2) => {
      return p1.a - p2.a
    })
  })
  return ps
}


// TOOD keep track of all found points
// when new one is found expand the blob to there smoothly + reverse
class Blob {
  constructor() {
    this.points = []
    this.keypoints = {
      "nose": {
        x: 0,
        y: 0
      },
      "leftEye": {
        x: 0,
        y: 0
      },
      "rightEye": {
        x: 0,
        y: 0
      },
    }
  }

  setPoints(keypoints) {
    let found = {
      "nose": false,
      "leftEye": false,
      "rightEye": false
    }
    keypoints.forEach((keypoint) => {
      switch (keypoint.part) {
        case "nose":
          found[nose] = true

      }
    })

  }

  render() {
    let canvas = this.canvas;
    let ctx = this.ctx;
    let center = getCenter(this.points);
    this.points.forEach((point) => {
      let v = {
        x: center.x - point.x,
        y: center.y - point.y
      }
      point.x -= v.x
      point.y -= v.y
    })
    let pointsArray = clockwise(this.points);

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
    // ctx.fillStyle = "blue";
    // ctx.fill();
    ctx.strokeStyle = 'red';
    ctx.stroke();

    ctx.beginPath();
    ctx.rect(center.x - 10, center.y - 10, 20, 20);
    ctx.fillStyle = "pink";
    ctx.fill();

  }

  push(item) {
    if (item instanceof Point) {
      this.points.push(item);
    }
  }

  set color(value) {
    this._color = value;
  }
  get color() {
    return this._color || '#000000';
  }

  set canvas(value) {
    if (value instanceof HTMLElement && value.tagName.toLowerCase() === 'canvas') {
      this._canvas = value;
      this.ctx = this._canvas.getContext('2d');
    }
  }
  get canvas() {
    return this._canvas;
  }

  set numPoints(value) {
    if (value > 2) {
      this._points = value;
    }
  }
  get numPoints() {
    return this._points || 32;
  }

  set radius(value) {
    if (value > 0) {
      this._radius = value;
    }
  }
  get radius() {
    return this._radius || 150;
  }

  set position(value) {
    if (typeof value == 'object' && value.x && value.y) {
      this._position = value;
    }
  }
  get position() {
    return this._position || {
        x: 0.5,
        y: 0.5
      };
  }

  get divisional() {
    return Math.PI * 2 / this.numPoints;
  }

  get center() {
    return {
      x: this.canvas.width * this.position.x,
      y: this.canvas.height * this.position.y
    };
  }

  set running(value) {
    this._running = value === true;
  }
  get running() {
    return this.running !== false;
  }
}

class Point {
  constructor(x, y) {
    this.x = x;
    this.y = y;
  }
}


export { Blob, Point }
