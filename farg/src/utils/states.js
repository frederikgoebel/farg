import gsap from "gsap";
import { saveVideoToBuffer, drawBody, CollisionBody, getPose, drawKeypoints } from './mirror';

const frontColor = "#F7566A";
const backColor = "#023F92";



class Idle {
  constructor() {
    this.collisionBody = new CollisionBody({
      x: 0,
      y: 0
    }, 3);
  }
  async tick(drawCtx, video, videoBuffer, posenet) {
    saveVideoToBuffer(video, videoBuffer);
    let pose = await getPose(posenet, videoBuffer.canvas);
    let allIn = this.collisionBody.colliding(pose);

    drawCtx.clearRect(0, 0, drawCtx.canvas.width, drawCtx.canvas.height)

    drawCtx.rect(0, 0, drawCtx.canvas.width, drawCtx.canvas.height)
    drawCtx.fillStyle = backColor;
    drawCtx.fill();

    drawCtx.drawImage(videoBuffer.canvas, 0, 0);

    this.collisionBody.debugDraw(drawCtx);
    drawKeypoints(pose.keypoints, 0.6, drawCtx);

    if (allIn)
      return "found"
    return "idle"
  }
}


class Found {
  constructor() {
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
    this.collisionBody = new CollisionBody({
      x: 0,
      y: 0
    }, 3);
  }

  async tick(drawCtx, video, videoBuffer, posenet) {
    saveVideoToBuffer(video, videoBuffer);
    let pose = await getPose(posenet, videoBuffer.canvas);
    let allIn = this.collisionBody.colliding(pose);

    drawCtx.clearRect(0, 0, drawCtx.canvas.width, drawCtx.canvas.height)

    drawCtx.rect(0, 0, drawCtx.canvas.width, drawCtx.canvas.height)
    drawCtx.fillStyle = backColor;
    drawCtx.fill();

    drawCtx.drawImage(videoBuffer.canvas, 0, 0);

    this.collisionBody.debugDraw(drawCtx);
    drawKeypoints(pose.keypoints, 0.6, drawCtx);



    if (allIn)
      this.fadeTl.play();
    else
      this.fadeTl.reverse()

    if (this.fadeTl.totalProgress() == 1)
      return "flash"
    else if (this.fadeTl.totalProgress() == 0)
      return "idle"
    return "found"
  }
}

class Flash {
  constructor() {
    this.flashObj = {
      lumen: 1.0,
    }
    this.flashTl = gsap.timeline({});
    this.flashTl.pause()
    this.flashTl.to(this.flashObj, {
      lumen: 0.0,
      duration: 0.7,
      ease: "power4.inOut",
    })
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

    if (this.flashTl.totalProgress() == 1)
      return "colorSteal"
    return "flash"
  }
}

class ColorSteal {
  constructor() {}
  async tick(drawCtx, video, videoBuffer, posenet) {
    drawCtx.clearRect(0, 0, drawCtx.canvas.width, drawCtx.canvas.height);
    drawCtx.save();
    drawCtx.drawImage(videoBuffer.canvas, 0, 0, videoBuffer.canvas.width, videoBuffer.canvas.height);
    drawCtx.restore();
    return "colorSteal"
  }
}


export { Idle, Found, Flash, ColorSteal }
