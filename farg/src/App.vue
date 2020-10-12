<template>
<div id="app" class="flex-container" @click="addSwatch()">
  <canvas id="canvas"></canvas>
  <transition-group name="stream" tag="div" id="color-stream" class="flex-container">
    <div v-for="(swatch, index) in swatches" :key="`swatch-${index}`" class="color-column">
      <div v-for=" (color, index) in swatch" :key="`color-${index}`" class="color-field" :style="{background:  color  }">
      </div>
    </div>
  </transition-group>
</div>

</div>
</template>

<script>
let swatchAmount = 6;

export default {
  name: 'app',
  components: {},
  data: () => ({
    swatches: [],
  }),
  methods: {
    rndColor() {
      return '#' + (0x1000000 + (Math.random()) * 0xffffff).toString(16).substr(1, 6)
    },
    addSwatch() {
      let tmpSwatches = []
      for (let i = 0; i < swatchAmount; i++) {
        tmpSwatches.push(this.rndColor());
      }
      this.swatches.push(tmpSwatches);
    },
  }
}
</script>

<style>
html,
body {
  width: 100%;
  height: 100%;
  margin: 0;
}

.flex-container {
  width: 100%;
  height: 100%;
  display: flex;
}

#canvas {
  height: 100%;
  width: 30%;
}

#color-stream {
  width: 70%;
  background: black;
  height: 100%;
  overflow: hidden;
  flex-direction: row-reverse;
}

.color-column {
  height: 100%;
  flex-grow: 1;
  transition: flex-grow 300ms ease-in, width 100ms ease-out;
  width: 0;
}

.color-field {
  height: 16.666%;
  background: red;
}

.stream-enter {
  flex-grow: 0.0000001;
}

.color-column:hover {
  width: 200px;
}
</style>
