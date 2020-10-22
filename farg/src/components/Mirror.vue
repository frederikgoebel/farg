<template>
<div class="mirror">
  <div class="item-100 beforeLoad" v-if="!isSupported">
    <p>Please use <a target="_blank" href="https://www.google.com/chrome/">Chrome</a> to sample your colors.</p>
  </div>
  <div class="item-100 beforeLoad" v-if="!loaded && !autoLoad && isSupported">
    <p>Enable your camera to sample your own colors.</p>
    <button @click="loadMirror">Enable camera</button>
  </div>
  <div v-if="loaded" class="callout">{{ callout }}</div>
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
    net: null,
    callout: "",
    loaded: false,
    stateMachine: null,
    drawRequest: null,
  }),
  props: {
    autoLoad: Boolean
  },
  mounted() {
    if (this.isSupported)
      console.log("mounted")
    this.stateMachine = new StateMachine(this.swatchAdded, this.setText)
    this.drawRequest = window.requestAnimationFrame(this.draw);
    if (this.autoLoad)
      this.loadMirror()
  },
  computed: {
    isSupported() {
      var ua = navigator.userAgent.toLowerCase();
      if (ua.indexOf('safari') != -1) {
        if (ua.indexOf('chrome') == -1) {
          return false
        }
      }
      return true
    },
  },
  methods: {
    loadMirror() {
      if (!this.isSupported)
        return
      mirror
        .setupCamera(this.$refs.video)
        .then(stopFn => {
          mirror.setupVideoBuffer(this.$refs.videoBuffer, this.$refs.video);
          tf.enableProdMode();
          posenet
            .load()
            .then(net => {
              console.log("backend:", tf.getBackend());
              this.net = net;
              this.stateMachine.state = "idle"
              this.loaded = true
            })
            .catch(err => {
              throw err;
            });
        })
        .catch(err => {
          console.log(err);
          if (__DEBUG_MODE) {
            this.drawRequest = window.requestAnimationFrame(this.draw);
          }
        });
    },
    swatchAdded(swatch) {
      this.$emit("swatchAdded", swatch);
    },
    draw() {
      this.resize(this.$refs.canvas);
      if (__DEBUG_MODE) {
        this.stateMachine
          .tick(this.$refs.canvas.getContext("2d"), null, null, null)
          .then(() => { this.drawRequest = window.requestAnimationFrame(this.draw) });
      } else {
        if (this.$refs.canvas && this.$refs.video && this.$refs.videoBuffer)
          this.stateMachine
          .tick(
            this.$refs.canvas.getContext("2d"),
            this.$refs.video,
            this.$refs.videoBuffer.getContext("2d"),
            this.net
          )
          .then(() => {
            this.drawRequest = window.requestAnimationFrame(this.draw);
          });
      }
    },
    resize(canvas) {
      if (!canvas) return;
      const width = canvas.clientWidth;
      const height = canvas.clientHeight;
      if (canvas.width !== width || canvas.height !== height) {
        canvas.width = width;
        canvas.height = height;
      }
      if (this.$refs.videoBuffer.width !== width || this.$refs.videoBuffer.height !== height) {
        this.$refs.videoBuffer.width = width;
        this.$refs.videoBuffer.height = height;
      }
    },
    setText(txt) {
      this.callout = txt;
    }
  },
  beforeDestroy() {
    if (this.drawRequest)
      window.cancelAnimationFrame(this.drawRequest);
    if (this.$refs.video) {
      mirror.destructCamera(this.$refs.video);
    }
  },
  components: { TitleCard }
};
</script>

<style>
.callout {
  font-size: 2.5rem;
  text-align: center;
  background: white;
  color: black;
  height: 10%;
}

.mirror {
  display: block;
  position: relative;
  align-items: stretch;
  width: 25%;
  flex-grow: 0;
  flex-shrink: 0;
  height: 100%;
}

@media (max-width:1000px) {
  .mirror {
    width: 100%;
  }
}

.hide {
  display: none;
}

.canvas {
  width: 100%;
  height: 90%;
}

.beforeLoad {
  font-size: 1.1rem;
  position: absolute;
  display: flex;
  justify-content: center;
  flex-direction: column;
  align-items: center;
  align-content: center;
  left: 0;
  bottom: 20%;
  width: 100%;
}

.beforeLoad a {
  text-decoration: underline;
}

.beforeLoad button {
  background: white;
  border: none;
  border-radius: 5px;
  cursor: pointer;
  padding: 20px;
}
</style>
