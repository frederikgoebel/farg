<template>
<div id="app" class="row" @click="addSwatch()">
  <Mirror @swatchAdded="addSwatch" />
  <Stream :swatches="swatches" />
  <div id="image-loader" />
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
    addSwatch(swatch) {
      // eslint-disable-next-line no-console
      console.log(swatch)
      if (swatch == undefined) {
        // eslint-disable-next-line no-redeclare
        var swatch = [];
        for (let i = 0; i < swatchAmount; i++) {
          swatch.push(this.rndColor());
        }
      }
      this.swatches.push(swatch);
    }
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

#image-loader {
  width: 233px;
  display: block;
}
</style>
