<template>
  <div class="mirror">
    <div class="callout">{{ callout }}</div>
    <canvas class="canvas" ref="canvas"></canvas>
    <video ref="video" playsinline autoplay style="display: none;"></video>
    <canvas ref="videoBuffer" style="display: none;"></canvas>
  </div>
</template>

<script>
import TitleCard from "./TitleCard";
import * as tf from "@tensorflow/tfjs";
import * as posenet from "@tensorflow-models/posenet";
import * as mirror from "../utils/mirror";
import StateMachine from "../utils/statemachine";

const __DEBUG_MODE = false;

export default {
  data: () => ({
    renderLayer: null,
    stateMachine: null,
    net: null,
    callout: ""
  }),
  methods: {
    swatchAdded(swatch) {
      this.$emit("swatchAdded", swatch);
    },
    draw() {
      this.resize(this.$refs.canvas);
      if (__DEBUG_MODE) {
        this.stateMachine
          .tick(this.$refs.canvas.getContext("2d"), null, null, null)
          .then(() => window.requestAnimationFrame(this.draw));
      } else {
        this.stateMachine
          .tick(
            this.$refs.canvas.getContext("2d"),
            this.$refs.video,
            this.$refs.videoBuffer.getContext("2d"),
            this.net
          )
          .then(() => {
            window.requestAnimationFrame(this.draw);
          });
      }
    },
    resize(canvas) {
      const width = canvas.clientWidth;
      const height = canvas.clientHeight;
      if (canvas.width !== width || canvas.height !== height) {
        canvas.width = width;
        canvas.height = height;
        this.$refs.videoBuffer.width = width;
        this.$refs.videoBuffer.height = height;
      }
    },
    setText(txt) {
      this.callout = txt;
    }
  },
  mounted() {
    this.stateMachine = new StateMachine(this.swatchAdded, this.setText);
    mirror
      .setupCamera(this.$refs.video)
      .then(stopFn => {
        mirror.setupVideoBuffer(this.$refs.videoBuffer, this.$refs.video);
        this.renderLayer = this.$refs.canvas.getContext("2d");
        tf.enableProdMode();
        posenet
          .load
          //   {
          //   architecture: 'MobileNetV1',
          //   outputStride: 16,
          //   inputResolution: { width: 257, height: 257 },
          //   multiplier: 0.75,
          // }
          ()
          .then(net => {
            console.log("backend:", tf.getBackend());
            this.net = net;
            window.requestAnimationFrame(this.draw);
          })
          .catch(err => {
            throw err;
          });
      })
      .catch(err => {
        console.log(err);
        if (__DEBUG_MODE) {
          window.requestAnimationFrame(this.draw);
        }
      });
  },
  beforeDestroy() {
    if (this.$refs.video) {
      mirror.destructCamera(this.$refs.video);
    }
  },
  components: { TitleCard }
};
</script>

<style>
.callout {
  font-size: 3rem;
  text-align: center;
  background: white;
  color: black;
  height: 10%;
}

.mirror {
  display: block;
  align-items: stretch;
  width: 25%;
  flex-grow: 0;
  flex-shrink: 0;
}

.canvas {
  width: 100%;
  height: 90%;
}
</style>
