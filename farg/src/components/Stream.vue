<template>
<transition-group name="stream" tag="div" id="color-stream" class="row">
  <div key="loadingMsg" v-if="isLoading">Loading ...</div>
  <div v-else v-for="(swatch, swatchIndex) in swatches" :key="`swatch-${swatchIndex}`" @click="selectSwatch(swatchIndex)" class="color-column" :class="{squash: preview, large: selectedSwatch==swatchIndex}">
    <div v-for=" (color, colorIndex) in swatch" :key="`color-${colorIndex}`" class="color-field" :style="{background:  color}">
      <div :class="{hidden: selectedSwatch!=swatchIndex}" class="color-info" :style="{color: invertColor(rgbaToHex(color),true)}">
        {{rgbaToHex(color)}}
      </div>
    </div>
    <div v-if="!preview" class="swatch-info">Yesterday</div>
  </div>
</transition-group>
</template>

<script>
import axios from 'axios';
import { rgbaToHex, invertColor } from '../utils/invertColor';

export default {
  data: () => ({
    isLoading: true,
    swatches: [],
    selectedSwatch: null,
  }),
  components: {},
  props: {
    streamID: {
      type: String,
      required: true,
    },
    preview: Boolean,
  },
  methods: {
    rgbaToHex,
    invertColor,
    selectSwatch(index) {
      if (index == this.selectedSwatch)
        this.selectedSwatch = null;
      else
        this.selectedSwatch = index;
    },
    addSwatch(swatch) {
      this.swatches.push(swatch);

      axios.post(process.env.VUE_APP_API_SERVER + '/' + this.streamID + '/swatches', {
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
    this.isLoading = true;
    axios.get(process.env.VUE_APP_API_SERVER + '/' + this.streamID + '/swatches')
      .then(response => {
        this.swatches = response.data.colors;
        if (this.swatches == null)
          this.swatches = []
        this.isLoading = false
      })
      .catch(function(error) {
        // handle error
        console.log(error);
      })


    this.socket = new WebSocket(process.env.VUE_APP_WS_SERVER);
    this.socket.onmessage = this.receiveMsg;
  },
}
</script>

<style scoped>
#color-stream {
  flex-direction: row;
  display: flex;
  flex-grow: 1;
  overflow: auto;
  -ms-overflow-style: none;
  /* IE and Edge */
  scrollbar-width: none;
  /* Firefox */
}

#color-stream::-webkit-scrollbar {
  display: none;
}

.color-column {
  height: 100%;
  flex-grow: 1;
  flex-shrink: 0;
  transition: flex-grow 300ms ease-in, width 100ms ease-out;
  width: 100px;
  padding-left: 10px;
  display: flex;
  flex-direction: column;
  cursor: pointer;
}

.squash {
  width: 1px;
  padding-left: 2px;
  flex-shrink: 1;
}

.color-column:last-child {
  padding-right: 10px;
}

.squash>.color-field {
  margin-bottom: 2px;
}

.color-field {
  flex-grow: 1;
  margin-bottom: 10px;
}

.color-field:first-child {
  margin-top: 10px;
}

.stream-enter {
  flex-grow: 0.0000001;
}

.swatch-info {
  color: gray;
  font-size: 0.8rem;
  text-align: center;
  margin-bottom: 10px;
}

.color-info {
  padding-left: 16px;
  padding-top: 16px;
  color: white;
  font-size: 0.8rem;
  opacity: 1;
  transition: opacity 0.2s ease;
  white-space: nowrap;
  overflow: hidden;
}

.color-info.hidden {
  opacity: 0.0;
}

.large {
  width: 300px;
}

/* .color-column:hover {
  width: 200px;
} */
</style>
