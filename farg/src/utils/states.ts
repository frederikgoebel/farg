import gsap from "gsap";
import SimplexNoise from 'simplex-noise'

import { Shapeshifter, toPoseDict } from "./skeleton";
import drawPathShape from "./blob";

import {
  saveVideoToBuffer,
  CollisionBody,
  getPose,
  drawKeypoints,
  updatePose,
  usedKeyPointParts
} from "./mirror";

import generateSwatches, { ColorSample, mockSwatch } from "./pixelator";
import {
  getHairBB,
  getFaceBB,
  getUpperBodyBB,
  getLowerBodyBB,
  getThighsBB,
  getFeetBB,
  BoundingBox,
  mockBB
} from "./getBoundingBoxes";

import { Swatch } from "./pixelator";

import easing from "./animation/easing";
import {
  Parallel,
  Sequential,
  Animation,
  Point2D
} from "./animation/animation";
import { LineAnimation } from "./animation/lineAnimation";
import {
  PaletteAnimation,
  highlightPalette
} from "./animation/paletteAnimation";
import Rectangle from "./animation/rectangleAnimation";

const frontColor = "#F7566A";
const backColor = "#023F92";

const __DEBUG_MODE = false;

const shapeshifter = new Shapeshifter({
  x: 200,
  y: 400
});

class BeforeLoad {
  time: number;
  simplex: SimplexNoise;
  constructor() {
    this.time = 0
    this.simplex = new SimplexNoise()
  }
  async tick(drawCtx, video, videoBuffer, posenet, dt) {
    drawCtx.clearRect(0, 0, drawCtx.canvas.width, drawCtx.canvas.height);

    shapeshifter.tick(undefined, dt);

    drawCtx.save();
    drawPathShape(drawCtx, shapeshifter.shape);
    drawCtx.clip();

    drawPathShape(drawCtx, shapeshifter.shape);
    drawCtx.fillStyle = "black";
    drawCtx.fill();

    drawCtx.lineWidth = 15;
    drawCtx.globalCompositeOperation = "screen";

    drawCtx.translate(0,0);
    drawPathShape(drawCtx, shapeshifter.shape);
    drawCtx.strokeStyle = "#FF0000";
    drawCtx.stroke();

    drawCtx.translate(this.simplex.noise2D(100, this.time)*6-3,this.simplex.noise2D(20, this.time)*6-3);
    drawPathShape(drawCtx, shapeshifter.shape);
    drawCtx.strokeStyle = "#1EFF33";
    drawCtx.stroke();

    drawCtx.translate(this.simplex.noise2D(1000, this.time) * 6-3,this.simplex.noise2D(20, this.time) * 6-3);
    drawPathShape(drawCtx, shapeshifter.shape);
    drawCtx.strokeStyle = "#E864FF";
    drawCtx.stroke();

    drawCtx.restore();

    this.time += dt/2000;

    return "beforeLoad";
  }
}

class Idle {
  time: number;
  setTextCallback: any;
  perfectTime: number;
  simplex: SimplexNoise;
  constructor(setTextCallback) {
    this.setTextCallback = setTextCallback;
    this.perfectTime = 0;
    this.simplex = new SimplexNoise()
    this.time = 0
  }
  async tick(
    drawCtx: CanvasRenderingContext2D,
    video,
    videoBuffer,
    posenet,
    dt
  ) {
    if (__DEBUG_MODE) return "colorSteal";

    saveVideoToBuffer(video, videoBuffer);
    await updatePose(posenet, videoBuffer.canvas, dt);
    const pose = getPose();
    const poseDict = toPoseDict(pose.keypoints);

    drawCtx.clearRect(0, 0, drawCtx.canvas.width, drawCtx.canvas.height);

    shapeshifter.tick(poseDict);

    drawCtx.save();
    drawPathShape(drawCtx, shapeshifter.shape);
    drawCtx.clip();
    drawCtx.drawImage(videoBuffer.canvas, 0, 0);

    drawCtx.lineWidth = 15;
    drawCtx.globalCompositeOperation = "screen";

    drawCtx.translate(0,0);
    drawPathShape(drawCtx, shapeshifter.shape);
    drawCtx.strokeStyle = "#FF0000";
    drawCtx.stroke();

    drawCtx.translate(this.simplex.noise2D(100, this.time)*6-3,this.simplex.noise2D(20, this.time)*6-3);
    drawPathShape(drawCtx, shapeshifter.shape);
    drawCtx.strokeStyle = "#1EFF33";
    drawCtx.stroke();

    drawCtx.translate(this.simplex.noise2D(1000, this.time) * 6-3,this.simplex.noise2D(20, this.time) * 6-3);
    drawPathShape(drawCtx, shapeshifter.shape);
    drawCtx.strokeStyle = "#E864FF";
    drawCtx.stroke();

    drawCtx.restore();

    let allIn = true;
    usedKeyPointParts.forEach(part => {
      if (poseDict[part] == undefined) allIn = false;
    });

    if (
      poseDict["leftEye"] == undefined ||
      poseDict["leftAnkle"] == undefined
    ) {
      this.setTextCallback("Go further away!");
      this.perfectTime = 0;
    } else if (allIn) {
      this.perfectTime += dt;
      this.setTextCallback("Perfect stay like this.");
    } else {
      this.setTextCallback("You need more light.");
      this.perfectTime = 0;
    }

    if (this.perfectTime > 3000) {
      this.perfectTime = 0;
      this.time= 0;
      return "flash";
    }
    this.time += dt/2000;
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

  async tick(drawCtx, video, videoBuffer, posenet, dt) {
    this.setTickEnabled && this.setTickEnabled(false);
    const collisionBody = new CollisionBody(
      {
        x: 20,
        y: 0
      },
      drawCtx.canvas.height / 280
    );

    saveVideoToBuffer(video, videoBuffer);
    this.setTickEnabled && this.setTickEnabled(true);

    const pose = await getPose(posenet, videoBuffer.canvas);
    const allIn = collisionBody.colliding(pose);

    drawCtx.clearRect(0, 0, drawCtx.canvas.width, drawCtx.canvas.height);
    drawCtx.drawImage(videoBuffer.canvas, 0, 0);

    collisionBody.debugDraw(drawCtx);
    // drawKeypoints(pose.keypoints, 0.6, drawCtx);

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

  async tick(drawCtx, video, videoBuffer, posenet, dt) {
    this.flashTl.play();
    if (this.flashTl.totalProgress() == 0) {
      saveVideoToBuffer(video, videoBuffer);
      await updatePose(posenet, videoBuffer.canvas, dt, true);
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
  colorCallback: (swatch: Swatch) => unknown;
  FIRST_TIME = true;
  pose: any;
  boundingBoxes?: BoundingBox[];
  swatch: Swatch = [];
  lastUpdate?: number;
  deltaTime = 0;
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
  async tick(drawCtx: CanvasRenderingContext2D, video, videoBuffer, posenet) {
    const now = Date.now();
    if (this.lastUpdate) {
      this.deltaTime = now - this.lastUpdate;
    }
    this.lastUpdate = now;

    drawCtx.clearRect(0, 0, drawCtx.canvas.width, drawCtx.canvas.height);
    drawCtx.save();
    if (!__DEBUG_MODE) {
      drawCtx.drawImage(
        videoBuffer.canvas,
        0,
        0,
        videoBuffer.canvas.width,
        videoBuffer.canvas.height
      );
    }

    drawCtx.restore();

    if (this.FIRST_TIME) {
      if (!__DEBUG_MODE) {
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
      } else {
        this.boundingBoxes = Array(6).fill(mockBB);
      }

      const margin = 0;

      this.boundingBoxes[0].startY -= margin;
      this.boundingBoxes[0].endY -= margin;

      if (__DEBUG_MODE) {
        this.boundingBoxes = this.boundingBoxes.slice(0, 1);
      }

      drawCtx.lineWidth = 1;
      drawCtx.strokeStyle = "white";

      // Generate swatches by reading the different keypoints of the pose
      let swatches: ColorSample[] = [];
      if (!__DEBUG_MODE) {
        swatches = generateSwatches(videoBuffer.canvas, this.boundingBoxes);
      } else {
        swatches = Array(6).fill(mockSwatch);
      }

      this.swatch = swatches.map(s => s.prominentColor);

      const lineAnimation = (from: [number, number], to: [number, number]) => {
        const animation = new LineAnimation(
          drawCtx,
          { x: from[0], y: from[1] },
          { x: to[0], y: to[1] },
          1500
        );
        animation.setName("LineAnimation");
        return animation;
      };

      const lineAnimations = this.boundingBoxes.map(bb => {
        const topHorizontal = lineAnimation(
          [bb.startX, bb.startY],
          [bb.endX, bb.startY]
        );

        const bottomHorizontal = lineAnimation(
          [bb.endX, bb.endY],
          [bb.startX, bb.endY]
        );

        const leftVertical = lineAnimation(
          [bb.startX, bb.startY],
          [bb.startX, bb.endY]
        );

        const rightVertical = lineAnimation(
          [bb.endX, bb.endY],
          [bb.endX, bb.startY]
        );

        const linesAnimation = new Parallel(
          topHorizontal,
          bottomHorizontal,
          leftVertical,
          rightVertical
        );
        linesAnimation.setName("Parallel lines");
        return linesAnimation;
      });

      const rectangleSize = {
        width: 80,
        height: drawCtx.canvas.height / 6
      };

      const destination: Point2D = {
        x: drawCtx.canvas.width - 80,
        y: 0
      };

      const paletteAnimations: Animation[] = this.boundingBoxes.map(
        (bb, index) => {
          const animation = new PaletteAnimation({
            ctx: drawCtx,
            swatch: swatches[index],
            topLeft: { x: bb.endX + 20, y: bb.startY - 20 },
            boxSize: 32,
            duration: 1500
          });
          animation.setName("PaletteAnimation");

          const highlight = highlightPalette({
            animation,
            duration: 4500,
            easingFunction: easing.easeOutCubic
          });
          highlight.setName("PaletteHighlightAnimation");

          const scaleConfig = {
            ctx: drawCtx,
            duration: 1000,
            size: rectangleSize,
            easingFunction: easing.easeInOutQuart,
            name: "ScaleAnimation"
          };

          const translateConfig = {
            duration: 1300,
            to: { ...destination },
            easingFunction: easing.easeOutQuart,
            name: "TranslateAnimation"
          };

          const rectangleAnimation = Rectangle.scale(scaleConfig).translate(
            translateConfig
          );

          rectangleAnimation.setName("RectangleAnimation");

          destination.y += rectangleSize.height;

          highlight.onFinish = () => {
            const highlightedBox = new Rectangle(
              swatches[index].prominentColor,
              highlight.highlightPosition().x,
              highlight.highlightPosition().y,
              32,
              32
            );

            rectangleAnimation.setRectangle(highlightedBox);
            highlight.fadeOut(500, easing.easeOutCubic);
          };

          const fullPaletteAnimation = Sequential.create(
            highlight,
            rectangleAnimation
          );
          fullPaletteAnimation.setName("fullPaletteAnimation");

          return fullPaletteAnimation;
        }
      );

      const allLineAnimations = new Parallel(...lineAnimations);
      allLineAnimations.setName("allLineAnimations");

      const allPaletteAnimations = new Parallel(...paletteAnimations);
      allPaletteAnimations.setName("allPaletteAnimations");

      this.animation = Sequential.create(
        allLineAnimations,
        allPaletteAnimations
      );
      this.animation.setName("Main animation");

      this.FIRST_TIME = false;
    }

    if (this.animation) {
      if (this.deltaTime && this.deltaTime !== 0) {
        this.animation.update(this.deltaTime);
        this.animation.render();
      }

      if (this.animation.isFinished() && !__DEBUG_MODE) {
        this.colorCallback(this.swatch);
        this.FIRST_TIME = true;

        this.deltaTime = 0;

        delete this.lastUpdate;
        delete this.animation;

        // console.log("Animation finished.");

        return "idle";
      }
    }

    // drawKeypoints(pose.keypoints, 0.6, drawCtx);

    return "colorSteal"; // TODO return colorSteal until everything is done
  }
}

export { Idle, Found, Flash, ColorSteal, BeforeLoad };
