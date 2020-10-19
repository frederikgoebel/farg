import gsap from "gsap";
import { Blob, Point } from "./blob";
import { saveVideoToBuffer, drawBody, CollisionBody, getPose, drawKeypoints } from './mirror';
import { drawEyeLine, Shapeshifter } from './skeleton'
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
    let collisionBody = new CollisionBody({
      x: 20,
      y: 0
    }, drawCtx.canvas.height / 280);

    saveVideoToBuffer(video, videoBuffer);
    let pose = await getPose(posenet, videoBuffer.canvas);
    let allIn = collisionBody.colliding(pose);

    drawCtx.clearRect(0, 0, drawCtx.canvas.width, drawCtx.canvas.height)

    drawCtx.rect(0, 0, drawCtx.canvas.width, drawCtx.canvas.height)
    drawCtx.fillStyle = backColor;
    drawCtx.fill();

    drawCtx.drawImage(videoBuffer.canvas, 0, 0);

    collisionBody.debugDraw(drawCtx);
    drawKeypoints(pose.keypoints, 0.6, drawCtx);

    // let blob = new Blob([])
    // blob.canvas = drawCtx.canvas;
    // pose.keypoints.forEach((keypoint) => {
    //   blob.points.push(new Point(keypoint.position.x, keypoint.position.y))
    // })

    // let blob = new Blob([new Point(1, 1), new Point(100, 1), new Point(100, 100), new Point(20, 200), new Point(50, 50)]);


    //blob.render();
    let leftEye ,
      rightEye,
      nose,
      leftShoulder,
      rightShoulder;
    pose.keypoints.forEach((keypoint) => {
      if (keypoint.part == "leftEye")
        leftEye = keypoint.position
      if (keypoint.part == "rightEye")
        rightEye = keypoint.position
      if (keypoint.part == "nose")
        nose = keypoint.position
      if (keypoint.part == "leftShoulder")
        leftShoulder = keypoint.position
      if (keypoint.part == "rightShoulder")
        rightShoulder = keypoint.position
    })

    this.shapeshifter.tick(pose.keypoints, drawCtx)




    // console.log(pose)

    if (allIn)
      return "idle"
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

  }

  async tick(drawCtx, video, videoBuffer, posenet) {

    let collisionBody = new CollisionBody({
      x: 20,
      y: 0
    }, drawCtx.canvas.height / 280);

    saveVideoToBuffer(video, videoBuffer);
    let pose = await getPose(posenet, videoBuffer.canvas);
    let allIn = collisionBody.colliding(pose);

    drawCtx.clearRect(0, 0, drawCtx.canvas.width, drawCtx.canvas.height)

    drawCtx.rect(0, 0, drawCtx.canvas.width, drawCtx.canvas.height)
    drawCtx.fillStyle = backColor;
    drawCtx.fill();

    drawCtx.drawImage(videoBuffer.canvas, 0, 0);

    collisionBody.debugDraw(drawCtx);
    drawKeypoints(pose.keypoints, 0.6, drawCtx);



    if (allIn)
      this.fadeTl.play();
    else
      this.fadeTl.reverse()

    if (this.fadeTl.totalProgress() == 1) {
      this.fadeTl.totalProgress(0);
      this.fadeTl.pause()
      return "flash"
    } else if (this.fadeTl.totalProgress() == 0)
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

    if (this.flashTl.totalProgress() == 1) {
      this.flashTl.totalProgress(0);
      this.flashTl.pause()
      return "colorSteal";
    }
    return "flash"
  }
}

class ColorSteal {
  constructor(colorCallback) {
    this.colorCallback = colorCallback;
  }
  rndColor() {
    return '#' + (0x1000000 + (Math.random()) * 0xffffff).toString(16).substr(1, 6)
  }
  async tick(drawCtx, video, videoBuffer, posenet) {
    drawCtx.clearRect(0, 0, drawCtx.canvas.width, drawCtx.canvas.height);
    drawCtx.save();
    drawCtx.drawImage(videoBuffer.canvas, 0, 0, videoBuffer.canvas.width, videoBuffer.canvas.height);
    drawCtx.restore();
    let swatch = []
    for (let i = 0; i < 6; i++) {
      swatch.push(this.rndColor());
    }
    this.colorCallback(swatch);
    return "idle" // TOOD return colorSteal until everything is done
  }
}


export { Idle, Found, Flash, ColorSteal }
