/* eslint-disable */

import gsap from "gsap";
import {
  saveVideoToBuffer,
  drawBody,
  CollisionBody,
  getPose,
  drawKeypoints
} from "./mirror";

import generateSwatches from "./pixelator";
import {
  getHairBB,
  getFaceBB,
  getUpperBodyBB,
  getLowerBodyBB,
  getThighsBB,
  getFeetBB,
  BoundingBox
} from "./getBoundingBoxes";

import { Swatch } from "./pixelator";

import {
  Parallel,
  Sequential,
  LineAnimation,
  PaletteAnimation,
  Animation,
  highlightPalette,
  easing
} from "./animation";

const frontColor = "#F7566A";
const backColor = "#023F92";

class Idle {
  constructor() {}
  async tick(drawCtx, video, videoBuffer, posenet) {
    let collisionBody = new CollisionBody(
      {
        x: 20,
        y: 0
      },
      drawCtx.canvas.height / 280
    );

    saveVideoToBuffer(video, videoBuffer);
    let pose = await getPose(posenet, videoBuffer.canvas);
    let allIn = collisionBody.colliding(pose);

    drawCtx.clearRect(0, 0, drawCtx.canvas.width, drawCtx.canvas.height);

    drawCtx.rect(0, 0, drawCtx.canvas.width, drawCtx.canvas.height);
    drawCtx.fillStyle = backColor;
    drawCtx.fill();

    drawCtx.drawImage(videoBuffer.canvas, 0, 0);

    collisionBody.debugDraw(drawCtx);
    drawKeypoints(pose.keypoints, 0.6, drawCtx);

    if (allIn) return "found";
    return "idle";
  }
}

class Found {
  bodyObj: {
    lineWidth: number;
  };
  fadeTl: gsap.core.Timeline;
  setTickEnabled: (boolean) => unknown;

  constructor(setTickEnabled: (enabled: boolean) => unknown) {
    this.bodyObj = {
      lineWidth: 5
    };
    this.fadeTl = gsap.timeline({});
    this.fadeTl.pause();
    this.fadeTl.to(this.bodyObj, {
      duration: 3,
      lineWidth: 200,
      ease: "sine.in"
    });
    this.setTickEnabled = setTickEnabled;
  }

  async tick(drawCtx, video, videoBuffer, posenet) {
    this.setTickEnabled && this.setTickEnabled(false);
    let collisionBody = new CollisionBody(
      {
        x: 20,
        y: 0
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
  flashObj: {
    lumen: number;
  };
  flashTl: gsap.core.Timeline;

  constructor() {
    this.flashObj = {
      lumen: 1.0
    };
    this.flashTl = gsap.timeline({});
    this.flashTl.pause();
    this.flashTl.to(this.flashObj, {
      lumen: 0.0,
      duration: 0.7,
      ease: "power4.inOut"
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
  colorCallback: (swatch: Swatch) => unknown;
  FIRST_TIME: boolean = true;
  pose: any;
  boundingBoxes?: BoundingBox[];
  swatch: Swatch = [];
  ANIMATION_FINISHED: boolean = false;
  lastUpdate?: number;
  deltaTime: number = 0;
  animation?: Animation;

  constructor(colorCallback) {
    this.colorCallback = colorCallback;
    this.pose = null;
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
      this.pose = await getPose(posenet, videoBuffer.canvas);

      const { keypoints } = this.pose;
      this.boundingBoxes = [
        getHairBB(keypoints),
        getFaceBB(keypoints),
        getUpperBodyBB(keypoints),
        getLowerBodyBB(keypoints),
        getThighsBB(keypoints),
        getFeetBB(keypoints)
      ];

      drawCtx.lineWidth = 1;
      drawCtx.strokeStyle = "white";

      // Generate swatches by reading the different keypoints of the pose
      const swatches = generateSwatches(videoBuffer.canvas, this.pose);

      const palettes = swatches.map(s => s.palette);

      this.swatch = swatches.map(s => s.prominentColor);

      const DURATION_MS = 3000;
      const lineAnimations = this.boundingBoxes.map(bb => {
        const topHorizontal = new LineAnimation(
          drawCtx,
          { x: bb.startX, y: bb.startY },
          { x: bb.endX, y: bb.startY },
          DURATION_MS
        );
        const bottomHorizontal = new LineAnimation(
          drawCtx,
          { x: bb.endX, y: bb.endY },
          { x: bb.startX, y: bb.endY },
          DURATION_MS
        );
        const leftVertical = new LineAnimation(
          drawCtx,
          { x: bb.startX, y: bb.startY },
          { x: bb.startX, y: bb.endY },
          DURATION_MS
        );
        const rightVertical = new LineAnimation(
          drawCtx,
          { x: bb.endX, y: bb.endY },
          { x: bb.endX, y: bb.startY },
          DURATION_MS
        );
        return new Parallel(
          topHorizontal,
          bottomHorizontal,
          leftVertical,
          rightVertical
        );
      });

      const paletteAnimations: Animation[] = this.boundingBoxes.map(
        (bb, index) => {
          const animation = new PaletteAnimation({
            ctx: drawCtx,
            swatch: swatches[index],
            topLeft: { x: bb.endX + 20, y: bb.startY - 20 },
            boxSize: 32,
            duration: DURATION_MS
          });

          return highlightPalette(animation, 3000, easing.easeOutCubic);
        }
      );

      this.animation = new Sequential(
        new Parallel(...lineAnimations),
        new Parallel(...paletteAnimations)
      );
      this.FIRST_TIME = false;
    }

    if (this.animation) {
      this.ANIMATION_FINISHED = this.animation.update(this.deltaTime);
      if (this.ANIMATION_FINISHED) delete this.animation;
    }

    // drawKeypoints(pose.keypoints, 0.6, drawCtx);

    if (this.ANIMATION_FINISHED) {
      this.colorCallback(this.swatch);
      this.FIRST_TIME = true;
      this.ANIMATION_FINISHED = false;
      this.deltaTime = 0;

      delete this.lastUpdate;

      return "idle";
    } else {
      return "colorSteal"; // TODO return colorSteal until everything is done
    }
  }
}

export { Idle, Found, Flash, ColorSteal };
