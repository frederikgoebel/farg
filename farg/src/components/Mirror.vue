<template>
<div class="mirror">
  <TitleCard>
    <b>{{callout}}</b>
  </TitleCard>

  <canvas class="canvas" ref="canvas"></canvas>
  <video ref="video" playsinline autoplay style="display: none;"> </video>
  <canvas ref="videoBuffer" style="display: none;"></canvas>
</div>
</template>

<script>
import TitleCard from './TitleCard'
import * as tf from '@tensorflow/tfjs';
import * as posenet from '@tensorflow-models/posenet';
import * as mirror from '../utils/mirror';
import StateMachine from '../utils/statemachine';


export default {
  data: () => ({
    renderLayer: null,
    stateMachine: null,
    net: null,
    callout: "",
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
    setText(txt) {
      this.callout = txt;
    },
  },
  mounted() {
    this.stateMachine = new StateMachine(this.swatchAdded, this.setText);
    mirror.setupCamera(this.$refs.video).then((stopFn) => {
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
  beforeDestroy() {
    mirror.destructCamera(this.$refs.video);
  },
  components: { TitleCard }

}
</script>

<style>
.mirror {
  display: block;
  align-items: stretch;
  height: 100%;
  width: 25%;
  flex-grow: 1;
  flex-shrink: 0;
}

.canvas {
  width: 100%;
  height: 100%;
}
</style>
