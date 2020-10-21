import gsap from "gsap";
import { saveVideoToBuffer, drawBody, CollisionBody, getPose, drawKeypoints, } from "./mirror";

import { Shapeshifter } from './skeleton'
import drawPathShape from './blob'
import pixelator, { generateSwatches } from "./pixelator";

const frontColor = "#F7566A";
const backColor = "#023F92";

class Idle {
  constructor() {
    this.shapeshifter = new Shapeshifter({
      x: 200,
      y: 400
    })
  }
  async tick(drawCtx, video, videoBuffer, posenet) {
    let collisionBody = new CollisionBody(
      {
        x: 20,
        y: 0,
      },
      drawCtx.canvas.height / 280
    );

    saveVideoToBuffer(video, videoBuffer);
    let pose = await getPose(posenet, videoBuffer.canvas);
    let allIn = collisionBody.colliding(pose);

    drawCtx.clearRect(0, 0, drawCtx.canvas.width, drawCtx.canvas.height);

    this.shapeshifter.tick(pose.keypoints)

    drawCtx.save();
    drawPathShape(drawCtx, this.shapeshifter.shape)
    drawCtx.clip();
    drawCtx.drawImage(videoBuffer.canvas, 0, 0);
    drawCtx.restore();

    // collisionBody.debugDraw(drawCtx);
    drawKeypoints(pose.keypoints, 0.6, drawCtx);

    drawCtx.save();
    drawCtx.lineWidth = 20;
    drawCtx.globalCompositeOperation = "screen";

    drawCtx.translate(0, 0);
    drawPathShape(drawCtx, this.shapeshifter.shape)
    drawCtx.strokeStyle = "red";
    drawCtx.stroke();

    drawCtx.translate(5, 0);
    drawPathShape(drawCtx, this.shapeshifter.shape)
    drawCtx.strokeStyle = "blue";
    drawCtx.stroke();

    drawCtx.translate(-3, 4);
    drawPathShape(drawCtx, this.shapeshifter.shape)
    drawCtx.strokeStyle = "green";
    drawCtx.stroke();

    drawCtx.translate(-4, -6);
    drawPathShape(drawCtx, this.shapeshifter.shape)
    drawCtx.strokeStyle = "cyan";
    drawCtx.stroke();

    drawCtx.restore()


    if (allIn)
      return "idle"
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

    drawCtx.rect(0, 0, drawCtx.canvas.width, drawCtx.canvas.height);
    drawCtx.fillStyle = backColor;
    drawCtx.fill();

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
