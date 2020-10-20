<template>
<transition-group name="stream" tag="div" id="color-stream" class="row">
  <div class="center" key="loadingMsg" v-if="isLoading">Loading ...</div>
  <div v-else v-for="(swatch, index) in swatches" :key="`swatch-${index}`" class="color-column" :class="{ squash: preview}">
    <div v-for=" (color, index) in swatch" :key="`color-${index}`" class="color-field" :style="{background:  color  }">
    </div>
  </div>
</transition-group>
</template>

<script>
import axios from 'axios';

export default {
  data: () => ({
    isLoading: true,
    swatches: [],
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

/* .color-column:hover {
  width: 200px;
} */
</style>
