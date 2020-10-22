import SAT from "sat";

const usedKeyPointParts = new Set([
  "leftEar",
  "rightEar",
  "leftShoulder",
  "rightShoulder",
  "leftElbow",
  "leftHip",
  "rightHip",
  "rightKnee",
  "leftAnkle"
]);

function drawPoint(ctx, x, y, r, color) {
  ctx.beginPath();
  ctx.arc(x, y, r, 0, 2 * Math.PI);
  ctx.fillStyle = color;
  ctx.fill();
}

function drawKeypoints(keypoints, minConfidence, ctx, scale = 1) {
  for (let i = 0; i < keypoints.length; i++) {
    const keypoint = keypoints[i];

    if (keypoint.score < minConfidence) {
      continue;
    }

    const {y, x} = keypoint.position;
    drawPoint(ctx, x * scale, y * scale, 3, "rgba(0,0,255,1)");
  }
}

class CollisionBody {
  constructor(pos, scale) {
    this.circle = new SAT.Circle(
      new SAT.Vector(pos.x + 50 * scale, pos.y + 30 * scale),
      30 * scale
    );
    this.body = new SAT.Polygon(new SAT.Vector(pos.x, pos.y + 50 * scale), [
      new SAT.Vector(),
      new SAT.Vector(100 * scale, 0),
      new SAT.Vector(100 * scale, 120 * scale),
      new SAT.Vector(80 * scale, 120 * scale),
      new SAT.Vector(80 * scale, 220 * scale),
      new SAT.Vector(20 * scale, 220 * scale),
      new SAT.Vector(20 * scale, 120 * scale),
      new SAT.Vector(0, 120 * scale)
    ]);
  }
  colliding(pose) {
    let remaining = usedKeyPointParts.size;
    if (pose.keypoints.length < usedKeyPointParts.size) return false;

    for (let i = 0; i < pose.keypoints.length; ++i) {
      if (usedKeyPointParts.has(pose.keypoints[i].part)) {
        const v = new SAT.Vector(
          pose.keypoints[i].position.x,
          pose.keypoints[i].position.y
        );
        if (
          SAT.pointInPolygon(v, this.body) ||
          SAT.pointInCircle(v, this.circle)
        ) {
          --remaining;
        }
      }
    }
    return remaining === 0;
  }

  debugDraw(ctx) {
    ctx.save();
    ctx.beginPath();
    ctx.arc(
      this.circle.pos.x,
      this.circle.pos.y,
      this.circle.r,
      0,
      2 * Math.PI
    );
    ctx.translate(this.body.pos.x, this.body.pos.y);
    ctx.moveTo(0, 0);
    this.body.points.forEach(vector => {
      ctx.lineTo(vector.x, vector.y);
    });
    ctx.closePath();
    ctx.fillStyle = "rgba(190,40,40,0.6)";
    ctx.fill();
    ctx.restore();
  }
}

function setupVideoBuffer(videoBuffer, video) {
  videoBuffer.width = video.videoWidth;
  videoBuffer.height = video.videoHeight;
  video.width = video.videoWidth;
  video.height = video.videoHeight;
}

async function setupCamera(video) {
  if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
    throw new Error(
      "Browser API navigator.mediaDevices.getUserMedia not available"
    );
  }

  const stream = await navigator.mediaDevices.getUserMedia({
    audio: false,
    video: {
      facingMode: 'user'
    }
  });
  video.srcObject = stream;

  return new Promise(resolve => {
    video.onloadedmetadata = () => {
      resolve();
    };
  });
}

function destructCamera(video) {
  const stream = video.srcObject;
  if (!stream)
    return

  const tracks = stream.getTracks();

  if (tracks) {
    tracks.forEach(function(track) {
      track.stop();
    });
  }

  video.srcObject = null;
}

function saveVideoToBuffer(video, buffer) {
  buffer.save();

  const scale = buffer.canvas.height / video.videoHeight;
  const offset = -(buffer.canvas.width - video.videoWidth * scale) / 2; //

  buffer.scale(scale, scale);
  buffer.scale(-1, 1);
  buffer.translate(-video.videoWidth, 0);
  buffer.translate(offset * (1 / scale), 0);
  buffer.drawImage(video, 0, 0, video.videoWidth, video.videoHeight);
  buffer.restore();
}

// TODO this is very hacky. make a nice class <3
let pose = undefined;

async function updatePose(net, video) {
  pose = await net.estimateSinglePose(video, {
    flipHorizontal: false,
    decodingMethod: "single-person"
  });
  pose.keypoints = pose.keypoints.filter(({score}) => score > 0.6);
}

function getPose() {
  return pose;
}

const raw = "161.833333 139.808458 221.333333 129 212.833333 211.144279 214.25 258.701493 239.75 266.267413 263.833333 264.105721 278 266.267413 295 288.965174 312 372.190299 338.916667 535.39801 341.75 655.371891 316.25 647.80597 299.25 518.104478 293.583333 478.113184 285.083333 453.253731 273.75 440.283582 272.333333 548.368159 272.333333 594.844527 261 694.282338 252.5 796.962687 248.25 899.643035 258.166667 998 227 998 198.666667 998 177.416667 896.400498 173.166667 836.95398 159 722.384328 142 630.512438 142 591.60199 136.333333 428.394279 116.5 520.266169 99.5 639.159204 93.8333333 681.312189 69.75 661.856965 69.75 569.985075 76.8333333 454.334577 99.5 304.097015 137.75 280.318408 153.333333 272.752488 167.5 251.135572 159 217.629353";

const numbers = raw.split(" ");

const drawList = [];
for (let i = 0; i < numbers.length; i += 2) {
  drawList.push({
    x: numbers[i] - 67.0,
    y: numbers[i + 1] - 125.0
  });
}

export { setupCamera, destructCamera, setupVideoBuffer, saveVideoToBuffer, getPose, updatePose, CollisionBody, drawKeypoints, usedKeyPointParts };
