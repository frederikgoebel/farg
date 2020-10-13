import SAT from 'sat';

const frontColor = "#F7566A";


class CollisionBody {
  constructor(scale, height, width) {
    const h = 200;
    this.body = new SAT.Polygon(new SAT.Vector(height / 2 - (100 * scale) / 2, h), [
      new SAT.Vector(),
      new SAT.Vector(100 * scale, 0),
      new SAT.Vector(100 * scale, 120 * scale),
      new SAT.Vector(80 * scale, 120 * scale),
      new SAT.Vector(80 * scale, 220 * scale),
      new SAT.Vector(20 * scale, 220 * scale),
      new SAT.Vector(20 * scale, 120 * scale),
      new SAT.Vector(0, 120 * scale)
    ]);
    this.circle = new SAT.Circle(new SAT.Vector(width / 2, h - 30 * scale), 30 * scale);
  }
  colliding(point) {
    return SAT.pointInPolygon(point, this.body) || SAT.pointInCircle(point, this.circle);
  }
}


const videoSize = {
  w: 256,
  h: 256
};

function setupVideoBuffer(videoBuffer, video) {
  videoBuffer.width = video.width;
  videoBuffer.height = video.height;
}

async function setupCamera(video) {
  if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
    throw new Error(
      'Browser API navigator.mediaDevices.getUserMedia not available');
  }
  video.width = videoSize.w;
  video.height = videoSize.h;

  let mobile = false;
  const stream = await navigator.mediaDevices.getUserMedia({
    'audio': false,
    'video': {
      facingMode: 'user',
      width: mobile ? undefined : videoSize.w,
      height: mobile ? undefined : videoSize.h,
    },
  });
  video.srcObject = stream;

  return new Promise((resolve) => {
    video.onloadedmetadata = () => {
      resolve(video);
    };
  });
}
function saveVideoToBuffer(video, buffer) {
  buffer.save();
  buffer.scale(-1, 1);
  buffer.translate(-videoSize.w, 0);
  buffer.drawImage(video, 0, 0, videoSize.w, videoSize.h);
  buffer.restore();
}

async function humanInShape(net, video) {
  const pose = await net.estimateSinglePose(video, {
    flipHorizontal: true,
    decodingMethod: 'single-person'
  });

  let allIn = true;
  pose.keypoints = pose.keypoints.filter(({score}) => score > 0.6);
  if (pose.keypoints.length == 0)
    allIn = false;

  let cBody = new CollisionBody(3.3, 200, 200);
  pose.keypoints.forEach(({position}) => {
    var v = new SAT.Vector(position.x, position.y);
    allIn &= cBody.colliding(v);
  })
  // drawKeypoints(pose.keypoints, 0.6, ctx)
  return allIn
}


let raw = "161.833333 139.808458 221.333333 129 212.833333 211.144279 214.25 258.701493 239.75 266.267413 263.833333 264.105721 278 266.267413 295 288.965174 312 372.190299 338.916667 535.39801 341.75 655.371891 316.25 647.80597 299.25 518.104478 293.583333 478.113184 285.083333 453.253731 273.75 440.283582 272.333333 548.368159 272.333333 594.844527 261 694.282338 252.5 796.962687 248.25 899.643035 258.166667 998 227 998 198.666667 998 177.416667 896.400498 173.166667 836.95398 159 722.384328 142 630.512438 142 591.60199 136.333333 428.394279 116.5 520.266169 99.5 639.159204 93.8333333 681.312189 69.75 661.856965 69.75 569.985075 76.8333333 454.334577 99.5 304.097015 137.75 280.318408 153.333333 272.752488 167.5 251.135572 159 217.629353"

let numbers = raw.split(" ");

let drawList = []
for (let i = 0; i < numbers.length; i += 2) {
  drawList.push({
    x: numbers[i] - 67.000000,
    y: numbers[i + 1] - 125.000000,
  })
}

function drawBody(ctx, color) {
  ctx.save();
  ctx.translate(0, 20);
  ctx.scale(1.25, 1.0)
  ctx.beginPath();
  ctx.moveTo(drawList[0].x, drawList[0].y);
  drawList.forEach((point) => {
    ctx.lineTo(point.x, point.y);
  });
  ctx.closePath();
  ctx.save();
  ctx.clip();
  ctx.strokeStyle = frontColor;
  ctx.lineWidth = 4;
  ctx.stroke();
  ctx.restore();
  ctx.restore();

  return
}


export { setupCamera, setupVideoBuffer, humanInShape, drawBody, saveVideoToBuffer }
