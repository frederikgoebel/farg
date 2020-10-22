import gsap from "gsap";
import { saveVideoToBuffer, CollisionBody, getPose, updatePose, drawKeypoints, usedKeyPointParts } from "./mirror";

import { Shapeshifter, toPoseDict } from './skeleton'
import drawPathShape from './blob'
import pixelator, { generateSwatches } from "./pixelator";

import { getHairBB, getFaceBB, getUpperBodyBB, getLowerBodyBB, getThighsBB, getFeetBB, } from "./getBoundingBoxes";

import { Parallel, Sequential, LineAnimation, PaletteAnimation, } from "./animation";

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
    await updatePose(posenet, videoBuffer.canvas);
    let pose = getPose();
    let poseDict = toPoseDict(pose.keypoints);

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

    let allIn = true;
    usedKeyPointParts.forEach(part => {
      if (poseDict[part] == undefined)
        allIn = false;
    })

    if ((poseDict["leftEye"] == undefined) || (poseDict["leftAnkle"] == undefined)) {
      this.setTextCallback("Go further away!")
      this.perfectTime = 0;
    } else if (allIn) {
      this.perfectTime += dt;
      this.setTextCallback("Perfect stay like this.")
    } else {
      this.setTextCallback("Searching for some bones..")
      this.perfectTime = 0;
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

    await updatePose(posenet, videoBuffer.canvas);
    let pose = getPose();
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
    if (this.flashTl.totalProgress() == 0) {
      saveVideoToBuffer(video, videoBuffer);
      await updatePose(posenet, videoBuffer.canvas);
    }


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
    this.FIRST_TIME = true;
    this.pose = null;
    this.boundingBoxes = null;
    this.swatch = null;
    this.ANIMATION_FINISHED = false;
  }

  rndColor() {
    return (
      "#" + (0x1000000 + Math.random() * 0xffffff).toString(16).substr(1, 6)
    );
  }
  async tick(drawCtx, video, videoBuffer, posenet) {
    const now = Date.now();
    if (this.lastUpdate) {
      this.deltaTime = now - this.lastUpdate;
    }
    this.lastUpdate = now;

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

    if (this.FIRST_TIME) {
      this.pose = getPose();

      const {keypoints} = this.pose;
      this.boundingBoxes = [
        getHairBB(keypoints),
        getFaceBB(keypoints),
        getUpperBodyBB(keypoints),
        getLowerBodyBB(keypoints),
        getThighsBB(keypoints),
        getFeetBB(keypoints),
      ];

      drawCtx.lineWidth = 1;
      drawCtx.strokeStyle = "white";

      // Generate swatches by reading the different keypoints of the pose
      const swatches = generateSwatches(videoBuffer.canvas, this.pose);

      const palettes = swatches.map((s) => s.palette);

      this.swatch = swatches.map((s) => s.prominentColor);

      const DURATION_MS = 3000;
      const lineAnimations = this.boundingBoxes.map((bb) => {
        const topHorizontal = new LineAnimation(
          drawCtx,
          {
            x: bb.startX,
            y: bb.startY
          },
          {
            x: bb.endX,
            y: bb.startY
          },
          DURATION_MS
        );
        const bottomHorizontal = new LineAnimation(
          drawCtx,
          {
            x: bb.endX,
            y: bb.endY
          },
          {
            x: bb.startX,
            y: bb.endY
          },
          DURATION_MS
        );
        const leftVertical = new LineAnimation(
          drawCtx,
          {
            x: bb.startX,
            y: bb.startY
          },
          {
            x: bb.startX,
            y: bb.endY
          },
          DURATION_MS
        );
        const rightVertical = new LineAnimation(
          drawCtx,
          {
            x: bb.endX,
            y: bb.endY
          },
          {
            x: bb.endX,
            y: bb.startY
          },
          DURATION_MS
        );
        return new Parallel(
          topHorizontal,
          bottomHorizontal,
          leftVertical,
          rightVertical
        );
      });

      const paletteAnimations = this.boundingBoxes.map(
        (bb, index) => new PaletteAnimation(
          drawCtx,
          palettes[index],
          {
            x: bb.endX + 20,
            y: bb.startY - 20
          },
          32,
          DURATION_MS
        )
      );

      this.animation = new Sequential(
        new Parallel(...lineAnimations),
        new Parallel(...paletteAnimations)
      );
      this.FIRST_TIME = false;
    }

    if (this.animation) {
      this.ANIMATION_FINISHED = this.animation.update(this.deltaTime);
      if (this.ANIMATION_FINISHED)
        delete this.animation;
    }

    // drawKeypoints(pose.keypoints, 0.6, drawCtx);

    if (this.ANIMATION_FINISHED) {
      this.colorCallback(this.swatch);
      this.FIRST_TIME = true;
      this.ANIMATION_FINISHED = false;
      delete this.lastUpdate;
      delete this.deltaTime;
      return "idle";
    } else {
      return "colorSteal"; // TODO return colorSteal until everything is done
    }
  }
}

export { Idle, Found, Flash, ColorSteal };
