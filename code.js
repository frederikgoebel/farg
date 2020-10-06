const color = 'aqua';

function drawPoint(ctx, y, x, r, color) {
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
    drawPoint(ctx, y * scale, x * scale, 3, color);
  }
}

function setupCanvas() {
  const canvas = document.getElementById('canvas');
  const ctx = canvas.getContext('2d');
  const captureButton = document.getElementById('capture');

  const constraints = {
    video: true,
  };

  captureButton.addEventListener('click', () => {
    context.drawImage(video, 0, 0, canvas.width, canvas.height);

    // Stop all video streams.
    video.srcObject.getVideoTracks().forEach(track => track.stop());
  });

  navigator.mediaDevices.getUserMedia(constraints)
    .then((stream) => {
      // Attach the video stream to the video element and autoplay.
      video.srcObject = stream;
    });
}

const videoWidth = 900;
const videoHeight = 900;

async function setupCamera() {
  if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
    throw new Error(
      'Browser API navigator.mediaDevices.getUserMedia not available');
  }
  const canvas = document.getElementById('canvas');
  const video = document.getElementById('video');
  video.width = videoWidth;
  video.height = videoHeight;
  canvas.width = videoWidth;
  canvas.height = videoHeight;

  let mobile = false;
  const stream = await navigator.mediaDevices.getUserMedia({
    'audio': false,
    'video': {
      facingMode: 'user',
      width: mobile ? undefined : videoWidth,
      height: mobile ? undefined : videoHeight,
    },
  });
  video.srcObject = stream;

  return new Promise((resolve) => {
    video.onloadedmetadata = () => {
      resolve(video);
    };
  });
}




async function setup() {
  const video = await setupCamera();
  const canvas = document.getElementById('canvas');
  const ctx = canvas.getContext('2d');
  posenet.load().then(async function(net) {
    const imageScaleFactor = 0.50;
    const flipHorizontal = true;
    const outputStride = 16;

    async function oneFrame() {
      const pose = await net.estimateSinglePose(video, {
        flipHorizontal: true,
        decodingMethod: 'single-person'
      });

      ctx.clearRect(0, 0, videoWidth, videoHeight);

      ctx.save();
      ctx.scale(-1, 1);
      ctx.translate(-videoWidth, 0);
      ctx.drawImage(video, 0, 0, videoWidth, videoHeight);
      ctx.restore();


      const scale = 3.0;
      const h = 200;
      var circle = new SAT.Circle(new SAT.Vector(h - 30 * scale, videoWidth / 2), 30 * scale);
      var body = new SAT.Polygon(new SAT.Vector(videoHeight / 2 - (100 * scale) / 2, h), [
        new SAT.Vector(),
        new SAT.Vector(100 * scale, 0),
        new SAT.Vector(100 * scale, 100 * scale),
        new SAT.Vector(80 * scale, 100 * scale),
        new SAT.Vector(80 * scale, 200 * scale),
        new SAT.Vector(20 * scale, 200 * scale),
        new SAT.Vector(20 * scale, 100 * scale),
        new SAT.Vector(0, 100 * scale)
      ]);

      let allIn = true;
      let poses = [];
      poses = poses.concat(pose);
      poses.forEach(({score, keypoints}) => {
        drawKeypoints(keypoints, 0.6, ctx);
        keypoints.forEach(({score, position}) => {
          if (score > 0.6) {
            var v = new SAT.Vector(position.x, position.y);
            allIn &= SAT.pointInCircle(v, circle) || SAT.pointInPolygon(v, body);
          }
        })
      });

      let shapeColor;
      if (allIn)
        shapeColor = "rgba(0,255,0,0.5)";
      else
        shapeColor = "rgba(255,0,0,0.5)";

      drawPoint(ctx, circle.pos.x, circle.pos.y, circle.r, shapeColor);



      ctx.save(),
      ctx.fillStyle = shapeColor;
      ctx.beginPath();
      ctx.translate(body.pos.x, body.pos.y);
      ctx.moveTo(0, 0);
      body.points.forEach((vector) => {
        ctx.lineTo(vector.x, vector.y);
      });
      ctx.closePath();
      ctx.fill();
      ctx.restore();

      requestAnimationFrame(oneFrame)
    }
    oneFrame()


  });

}

setup();
