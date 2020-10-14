<template>
<div class="mirror">
  <canvas class="canvas" ref="canvas"></canvas>
  <video ref="video" playsinline autoplay style="display: none;"> </video>
  <canvas ref="videoBuffer" style="display: none;"></canvas>
</div>
</template>

<script>
import * as tf from '@tensorflow/tfjs';
import * as posenet from '@tensorflow-models/posenet';
import * as mirror from '../utils/mirror';
import StateMachine from '../utils/statemachine';

export default {
  data: () => ({
    renderLayer: null,
    stateMachine: null,
    net: null,
  }),
  methods: {
    swatchAdded(swatch) {
      this.$emit("swatchAdded", swatch);
    },
    draw() {
      this.resize(this.$refs.canvas);

      this.stateMachine.tick(this.$refs.canvas.getContext("2d"), this.$refs.video, this.$refs.videoBuffer.getContext("2d"), this.net).then(() => {
        window.requestAnimationFrame(this.draw);
      })
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
  },
  mounted() {
    this.stateMachine = new StateMachine(this.swatchAdded);
    mirror.setupCamera(this.$refs.video).then(() => {
      mirror.setupVideoBuffer(this.$refs.videoBuffer, this.$refs.video)
      this.renderLayer = this.$refs.canvas.getContext("2d");
      tf.enableProdMode()
      posenet.load(
        //   {
        //   architecture: 'MobileNetV1',
        //   outputStride: 16,
        //   inputResolution: { width: 257, height: 257 },
        //   multiplier: 0.75,
        // }
      ).then((net) => {
        console.log("backend:", tf.getBackend());
        this.net = net;
        window.requestAnimationFrame(this.draw);
      }).catch((err) => {
        throw (err)
      })
    })
  },
}
</script>

<style>
.mirror {
  display: flex;
  align-items: stretch;
  height: 100%;
  width: 30%;
}

.canvas {
  flex-grow: 1;
}
</style>
