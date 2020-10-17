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
    socket: null,
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

      axios.post('http://' + process.env.VUE_APP_SERVER + '/debug/swatches', {
        colors: swatch,
      }).catch(function(error) {
        // handle error
        console.log(error);
      })
    },
    receiveMsg(event) {
      console.log(event.data);

      var msg = JSON.parse(event.data);
      console.log(msg);
      this.swatches.push(msg.colors);
    }
  },
  mounted() {
    axios.get('http://' + process.env.VUE_APP_SERVER + '/debug/swatches')
      .then(response => {
        this.swatches = response.data.colors;
        if (this.swatches == null)
          this.swatches = []
        console.log("response", response);
      })
      .catch(function(error) {
        // handle error
        console.log(error);
      })


    this.socket = new WebSocket('wss://' + process.env.VUE_APP_SERVER + '/ws');
    this.socket.onmessage = this.receiveMsg;
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
