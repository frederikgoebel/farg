import gsap from "gsap";
import { saveVideoToBuffer, CollisionBody, getPose, drawKeypoints, usedKeyPointParts } from "./mirror";

import { Shapeshifter, toPoseDict } from './skeleton'
import drawPathShape from './blob'
import pixelator, { generateSwatches } from "./pixelator";

class Idle {
  constructor(setTextCallback) {
    this.shapeshifter = new Shapeshifter({
      x: 200,
      y: 400
    });
    this.setTextCallback = setTextCallback;
    this.perfectTime = 0;
  }
  async tick(drawCtx, video, videoBuffer, posenet, dt) {
    saveVideoToBuffer(video, videoBuffer);
    let pose = await getPose(posenet, videoBuffer.canvas);
    let poseDict = toPoseDict(pose.keypoints)

    drawCtx.clearRect(0, 0, drawCtx.canvas.width, drawCtx.canvas.height);

    this.shapeshifter.tick(poseDict)

    drawCtx.save();
    drawPathShape(drawCtx, this.shapeshifter.shape)
    drawCtx.clip();
    drawCtx.drawImage(videoBuffer.canvas, 0, 0);
    drawCtx.restore();

    // collisionBody.debugDraw(drawCtx);
    drawKeypoints(pose.keypoints, 0.6, drawCtx);

    drawCtx.save();
    drawCtx.lineWidth = 15;
    drawCtx.globalCompositeOperation = "screen";

    drawCtx.translate(0, 0);
    drawPathShape(drawCtx, this.shapeshifter.shape)
    drawCtx.strokeStyle = "#FF0000";
    drawCtx.stroke();

    drawCtx.translate(7, 0);
    drawPathShape(drawCtx, this.shapeshifter.shape)
    drawCtx.strokeStyle = "#1EFF33";
    drawCtx.stroke();

    drawCtx.translate(-9, 4);
    drawPathShape(drawCtx, this.shapeshifter.shape)
    drawCtx.strokeStyle = "#E864FF";
    drawCtx.stroke();

    drawCtx.restore()

    console.log(pose)
    console.log(poseDict)

    let allIn = true;
    usedKeyPointParts.forEach(part => {
      if (poseDict[part] == undefined)
        allIn = false;
    })

    if ((poseDict["leftEye"] == undefined) || (poseDict["leftAnkle"] == undefined)) {
      this.setTextCallback("Go further away!")
    } else if (allIn) {
      this.perfectTime += dt;
      this.setTextCallback("Perfect stay like this.")
    } else {
      this.setTextCallback("Searching for some bones..")
    }

    if (this.perfectTime > 3000) {
      this.perfectTime = 0;
      return "flash"
    }

    return "idle"
  }
}

class Found {
  constructor(setTickEnabled) {
    this.bodyObj = {
      lineWidth: 5,
    };
    this.fadeTl = gsap.timeline({});
    this.fadeTl.pause();
    this.fadeTl.to(this.bodyObj, {
      duration: 3,
      lineWidth: 200,
      ease: "sine.in",
    });
    this.setTickEnabled = setTickEnabled;
  }

  async tick(drawCtx, video, videoBuffer, posenet) {
    this.setTickEnabled && this.setTickEnabled(false);
    let collisionBody = new CollisionBody(
      {
        x: 20,
        y: 0,
      },
      drawCtx.canvas.height / 280
    );

    saveVideoToBuffer(video, videoBuffer);
    this.setTickEnabled && this.setTickEnabled(true);

    let pose = await getPose(posenet, videoBuffer.canvas);
    let allIn = collisionBody.colliding(pose);

    drawCtx.clearRect(0, 0, drawCtx.canvas.width, drawCtx.canvas.height);
    drawCtx.drawImage(videoBuffer.canvas, 0, 0);

    collisionBody.debugDraw(drawCtx);
    drawKeypoints(pose.keypoints, 0.6, drawCtx);

    if (allIn) this.fadeTl.play();
    else this.fadeTl.reverse();

    if (this.fadeTl.totalProgress() == 1) {
      this.fadeTl.totalProgress(0);
      this.fadeTl.pause();
      return "flash";
    } else if (this.fadeTl.totalProgress() == 0) return "idle";
    return "found";
  }
}

class Flash {
  constructor() {
    this.flashObj = {
      lumen: 1.0,
    };
    this.flashTl = gsap.timeline({});
    this.flashTl.pause();
    this.flashTl.to(this.flashObj, {
      lumen: 0.0,
      duration: 0.7,
      ease: "power4.inOut",
    });
  }

  async tick(drawCtx, video, videoBuffer, posenet) {
    this.flashTl.play();
    if (this.flashTl.totalProgress() == 0)
      saveVideoToBuffer(video, videoBuffer);

    drawCtx.clearRect(0, 0, drawCtx.canvas.width, drawCtx.canvas.height);

    drawCtx.drawImage(videoBuffer.canvas, 0, 0);

    drawCtx.rect(0, 0, drawCtx.canvas.width, drawCtx.canvas.height);
    drawCtx.fillStyle = "rgba(255,255,255," + this.flashObj.lumen + ")";
    drawCtx.fill();

    if (this.flashTl.totalProgress() == 1) {
      this.flashTl.totalProgress(0);
      this.flashTl.pause();
      return "colorSteal";
    }
    return "flash";
  }
}

class ColorSteal {
  constructor(colorCallback) {
    this.colorCallback = colorCallback;
  }
  rndColor() {
    return (
      "#" + (0x1000000 + Math.random() * 0xffffff).toString(16).substr(1, 6)
    );
  }
  async tick(drawCtx, video, videoBuffer, posenet) {
    const pose = await getPose(posenet, videoBuffer.canvas);
    drawCtx.clearRect(0, 0, drawCtx.canvas.width, drawCtx.canvas.height);
    drawCtx.save();
    drawCtx.drawImage(
      videoBuffer.canvas,
      0,
      0,
      videoBuffer.canvas.width,
      videoBuffer.canvas.height
    );
    drawCtx.restore();
    drawKeypoints(pose.keypoints, 0.6, drawCtx);
    // Generate swatch by reading the different keypoints of the pose
    const swatch = generateSwatches(videoBuffer.canvas, pose);

    this.colorCallback(swatch);
    return "idle"; // TOOD return colorSteal until everything is done
  }
}

export { Idle, Found, Flash, ColorSteal };
