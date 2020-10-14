<template>
<div id="app" class="row" @click="addSwatch()">
  <Mirror @swatchAdded="addSwatch" />
  <Stream :swatches="swatches" />
</div>
</template>

<script>
import axios from 'axios'

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
      console.log(swatch)
      if (swatch == undefined) {
        var swatch = [];
        for (let i = 0; i < swatchAmount; i++) {
          swatch.push(this.rndColor());
        }
      }
      this.swatches.push(swatch);

      axios.post('http://localhost:8082/debug/swatches', {
        colors: swatch,
      }).catch(function(error) {
        // handle error
        console.log(error);
      })
    }
  },
  mounted() {
    axios.get('http://localhost:8082/debug/swatches')
      .then(response => {
        this.swatches = response.data.colors;
        console.log("response", response);
      })
      .catch(function(error) {
        // handle error
        console.log(error);
      })
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
