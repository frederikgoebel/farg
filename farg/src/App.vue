<template>
<div id="app" class="row" @click="addSwatch()">
  <Mirror />
  <Stream :swatches="swatches" />
</div>
</template>

<script>
import Stream from './components/Stream.vue'
import Mirror from './components/Mirror.vue'
let swatchAmount = 6;

export default {
  name: 'app',
  components: {
    Stream,
    Mirror,
  },
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
</style>
