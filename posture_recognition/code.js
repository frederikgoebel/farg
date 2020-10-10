const videoWidth = 900;
const videoHeight = 900;

const frontColor = "#F7566A";
const backColor = "#023F92";

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




  let raw = "161.833333 139.808458 221.333333 129 212.833333 211.144279 214.25 258.701493 239.75 266.267413 263.833333 264.105721 278 266.267413 295 288.965174 312 372.190299 338.916667 535.39801 341.75 655.371891 316.25 647.80597 299.25 518.104478 293.583333 478.113184 285.083333 453.253731 273.75 440.283582 272.333333 548.368159 272.333333 594.844527 261 694.282338 252.5 796.962687 248.25 899.643035 258.166667 998 227 998 198.666667 998 177.416667 896.400498 173.166667 836.95398 159 722.384328 142 630.512438 142 591.60199 136.333333 428.394279 116.5 520.266169 99.5 639.159204 93.8333333 681.312189 69.75 661.856965 69.75 569.985075 76.8333333 454.334577 99.5 304.097015 137.75 280.318408 153.333333 272.752488 167.5 251.135572 159 217.629353"

  let numbers = raw.split(" ");

  let drawList = []
  for (let i = 0; i < numbers.length; i += 2) {
    drawList.push({
      x: numbers[i] - 67.000000,
      y: numbers[i + 1] - 125.000000,
    })
  }


  posenet.load().then(async function(net) {
    const imageScaleFactor = 0.50;
    const flipHorizontal = true;
    const outputStride = 16;

    async function humanInShape() {
      const pose = await net.estimateSinglePose(video, {
        flipHorizontal: true,
        decodingMethod: 'single-person'
      });

      let allIn = true;
      pose.keypoints = pose.keypoints.filter(({score}) => score > 0.6);
      if (pose.keypoints.length == 0)
        allIn = false;


      pose.keypoints.forEach(({position}) => {
        var v = new SAT.Vector(position.x, position.y);
        allIn &= SAT.pointInPolygon(v, body) || SAT.pointInCircle(v, circle);
      })
      // drawKeypoints(pose.keypoints, 0.6, ctx)
      return allIn
    }

    function saveVideoToBuffer(video, buffer) {
      buffer.save();
      buffer.scale(-1, 1);
      buffer.translate(-videoWidth, 0);
      buffer.drawImage(video, 0, 0, videoWidth, videoHeight);
      buffer.restore();
    }


    function drawBody(color) {
      ctx.save();
      ctx.translate(300, 20);
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
      ctx.lineWidth = bodyObj.lineWidth;
      ctx.stroke();
      ctx.restore();
      ctx.restore();

      return

      ctx.fillStyle = ctx.strokeStyle = color;

      // head
      ctx.beginPath();
      ctx.arc(circle.pos.x, circle.pos.y, circle.r, 0, 2 * Math.PI);

      // // body
      ctx.save();
      ctx.translate(body.pos.x, body.pos.y);
      ctx.moveTo(0, 0);
      body.points.forEach((vector) => {
        ctx.lineTo(vector.x, vector.y);
      });
      ctx.closePath();
      ctx.save();
      ctx.clip();
      ctx.lineWidth = bodyObj.lineWidth;
      ctx.stroke();
      ctx.restore();
      ctx.restore();
    }

    async function idle() {

      let allIn = await humanInShape()
      ctx.clearRect(0, 0, videoWidth, videoHeight);

      ctx.rect(0, 0, canvas.width, canvas.height);
      ctx.fillStyle = backColor;
      ctx.fill();

      saveVideoToBuffer(video, videoContext)

      // bg
      ctx.save();
      ctx.translate(300, 20);
      ctx.scale(1.25, 1.0)
      ctx.beginPath();
      ctx.moveTo(drawList[0].x, drawList[0].y);
      drawList.forEach((point) => {
        ctx.lineTo(point.x, point.y);
      });
      ctx.clip()
      ctx.scale(0.8, 1.0)
      ctx.translate(-300, -20);

      ctx.drawImage(videoBuffer, 0, 0, videoWidth, videoHeight);
      ctx.restore();

      drawBody("rgba(255,0,0,0.5)");

      if (allIn)
        return "found"
      return "idle"
    }


    let bodyObj = {
      lineWidth: 5,
    }

    var fadeTl = gsap.timeline({});
    fadeTl.pause();
    fadeTl.to(bodyObj, {
      duration: 3,
      lineWidth: 200,
      ease: "sine.in",
    });

    async function found() {
      let allIn = await humanInShape()
      ctx.clearRect(0, 0, videoWidth, videoHeight);

      ctx.rect(0, 0, canvas.width, canvas.height);
      ctx.fillStyle = backColor;
      ctx.fill();

      saveVideoToBuffer(video, videoContext)

      // bg
      ctx.save();
      ctx.translate(300, 20);
      ctx.scale(1.25, 1.0)
      ctx.beginPath();
      ctx.moveTo(drawList[0].x, drawList[0].y);
      drawList.forEach((point) => {
        ctx.lineTo(point.x, point.y);
      });
      ctx.clip()
      ctx.scale(0.8, 1.0)
      ctx.translate(-300, -20);
      ctx.drawImage(videoBuffer, 0, 0, videoWidth, videoHeight);
      ctx.restore();

      drawBody("rgba(0,255,0,0.5)");

      if (fadeTl.totalProgress() == 1)
        return "flash"
      else if (!allIn)
        return "idle"
      return "found"
    }

    function idle2found() {
      fadeTl.play();
    }

    function found2idle() {
      fadeTl.reverse();
    }


    let flashObj = {
      lumen: 1.0,
    }
    var flashTl = gsap.timeline({});
    flashTl.pause()
    flashTl.to(flashObj, {
      lumen: 0.0,
      duration: 0.7,
      ease: "power4.inOut",
    })


    function found2flash() {
      flashTl.play();
      saveVideoToBuffer(video, videoContext);
    }

    async function flash() {
      ctx.clearRect(0, 0, videoWidth, videoHeight);

      ctx.save();
      ctx.drawImage(videoBuffer, 0, 0, videoWidth, videoHeight);
      ctx.restore();

      ctx.rect(0, 0, canvas.width, canvas.height);
      ctx.fillStyle = "rgba(255,255,255," + flashObj.lumen + ")";
      ctx.fill();


      if (flashTl.totalProgress() == 1)
        return "colorSteal"
      return "flash"
    }

    async function colorSteal() {
      ctx.clearRect(0, 0, videoWidth, videoHeight);
      ctx.save();
      ctx.drawImage(videoBuffer, 0, 0, videoWidth, videoHeight);
      ctx.restore();
      return "colorSteal"
    }

    async function lost() {
      let allIn = await humanInShape()
      ctx.clearRect(0, 0, videoWidth, videoHeight);

      videoContext.save();
      videoContext.scale(-1, 1);
      videoContext.translate(-videoWidth, 0);
      videoContext.drawImage(video, 0, 0, videoWidth, videoHeight);
      videoContext.restore();

      ctx.save();
      ctx.drawImage(videoBuffer, 0, 0, videoWidth, videoHeight);
      ctx.restore();

      ctx.save(),
      ctx.fillStyle = "rgba(0,255,0,0.5)";
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

      lineWidth /= 1.5;

      if (lineWidth <= 5)
        return "idle"
      else if (allIn)
        return "found"
      return "lost"
    }

    let states = {
      "idle": idle,
      "found": found,
      "lost": lost,
      "flash": flash,
      "colorSteal": colorSteal,
    }
    let transitions = {
      "idle": {
        "found": idle2found
      },
      "found": {
        "idle": found2idle,
        "flash": found2flash,
      },
      "lost": {},
      "flash": {},
      "colorSteal": {},
    }
    let state = "idle"
    async function oneFrame() {
      let newState = await states[state]();
      if (transitions[state][newState]) {
        transitions[state][newState]();
      }
      state = newState;
      requestAnimationFrame(oneFrame);
    }
    oneFrame();


  });

}

setup();
