const videoWidth = 900;
const videoHeight = 900;

async function setupCamera() {
  if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
    throw new Error(
      'Browser API navigator.mediaDevices.getUserMedia not available');
  }
  const canvas = document.getElementById('canvas');
  const videoBuffer = document.getElementById('videoBuffer');
  const video = document.getElementById('video');
  video.width = videoWidth;
  video.height = videoHeight;
  canvas.width = videoWidth;
  canvas.height = videoHeight;
  videoBuffer.width = videoWidth;
  videoBuffer.height = videoHeight;

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
  const videoBuffer = document.getElementById('videoBuffer');
  const ctx = canvas.getContext('2d');
  const videoContext = videoBuffer.getContext('2d');
  let lineWidth = 1;
  let imageSnapped = false;
  const scale = 3.3;
  const h = 200;
  var circle = new SAT.Circle(new SAT.Vector(videoWidth / 2, h - 30 * scale), 30 * scale);
  var body = new SAT.Polygon(new SAT.Vector(videoHeight / 2 - (100 * scale) / 2, h), [
    new SAT.Vector(),
    new SAT.Vector(100 * scale, 0),
    new SAT.Vector(100 * scale, 120 * scale),
    new SAT.Vector(80 * scale, 120 * scale),
    new SAT.Vector(80 * scale, 220 * scale),
    new SAT.Vector(20 * scale, 220 * scale),
    new SAT.Vector(20 * scale, 120 * scale),
    new SAT.Vector(0, 120 * scale)
  ]);
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

      if (!imageSnapped) {
        videoContext.save();
        videoContext.scale(-1, 1);
        videoContext.translate(-videoWidth, 0);
        videoContext.drawImage(video, 0, 0, videoWidth, videoHeight);
        videoContext.restore();
      }

      ctx.save();
      ctx.drawImage(videoBuffer, 0, 0, videoWidth, videoHeight);
      ctx.restore();
      let allIn = true;

      drawKeypoints(pose.keypoints, 0.6, ctx);

      pose.keypoints = pose.keypoints.filter(({score}) => score > 0.6);
      if (pose.keypoints.length == 0)
        allIn = false;
      pose.keypoints.forEach(({position}) => {
        var v = new SAT.Vector(position.x, position.y);
        allIn &= SAT.pointInPolygon(v, body) || SAT.pointInCircle(v, circle);
      })


      let shapeColor;
      if (allIn) {
        shapeColor = "transparent";
        lineWidth = Math.ceil(lineWidth * 1.3);
      } else {
        shapeColor = "rgba(0,255,0,0.5)";
        lineWidth = 5;
      }


      if (lineWidth < 100) {
        drawPoint(ctx, shapeColor);

        ctx.beginPath();
        ctx.arc(circle.pos.x, circle.pos.y, circle.r, 0, 2 * Math.PI);
        ctx.save();
        ctx.clip();
        ctx.strokeStyle = "rgba(0,255,0,0.5)"
        //ctx.fill();
        ctx.stroke();
        ctx.restore();

        ctx.save(),
        ctx.fillStyle = shapeColor;
        ctx.strokeStyle = "rgba(0,255,0,0.5)"
        ctx.beginPath();
        ctx.translate(body.pos.x, body.pos.y);
        ctx.moveTo(0, 0);
        body.points.forEach((vector) => {
          ctx.lineTo(vector.x, vector.y);
        });
        ctx.closePath();
        ctx.save();
        ctx.clip();
        ctx.lineWidth = lineWidth;
        //ctx.fill();
        ctx.stroke();
        ctx.restore();
        ctx.restore();
      } else if (!imageSnapped) {
        ctx.fillStyle = "white";
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        imageSnapped = true;
      } else {
      }

      requestAnimationFrame(oneFrame)
    }
    oneFrame()


  });

}


// function main(){
//   switch(state){
//     case Idle:
//       recognize position
//       case position recognized:
//         fill shape;
//       case shape full:
//       snap image;
//       case image there:
//         other people deal with dis;
//   }
// }

setup();
