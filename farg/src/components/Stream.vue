<template>
  <transition-group name="stream" tag="div" id="color-stream" class="row">
    <Mirror v-if="showMirror" key="mirror" @swatchAdded="addSwatch" />
    <div key="loadingMsg" v-if="isLoading">Loading ...</div>
    <div
      v-else
      v-for="swatch in swatchesToShow"
      :key="`swatch-${swatch.id}`"
      class="color-column"
      :class="{ squash: preview, large: selectedSwatch == swatch.id }"
    >
      <div
        v-for="(color, colorIndex) in swatch.colors"
        :key="`color-${colorIndex}`"
        class="color-field"
        :style="{ background: color }"
        @click="selectSwatch(swatch.id)"
      >
        <div
          :class="{ hidden: selectedSwatch != swatch.id }"
          class="color-info"
          :style="{ color: invertColor(rgbaToHex(color), true) }"
        >
          {{ rgbaToHex(color) }}
        </div>
      </div>
      <div v-if="!preview" class="swatch-info">
        {{ toRelativeTime(swatch.creationDate) }}
      </div>
    </div>
    <div key="imageLoader" id="image-loader" style="display: none;"></div>
  </transition-group>
</template>

<script>
import axios from "axios";
import Mirror from "./Mirror";
import { rgbaToHex, invertColor } from "../utils/invertColor";
import TimeAgo from "javascript-time-ago";
import en from "javascript-time-ago/locale/en";

TimeAgo.addDefaultLocale(en);

const timeAgo = new TimeAgo();

export default {
  data: () => ({
    isLoading: true,
    swatches: [],
    selectedSwatch: null,
    creatorID: "unknown",
    tmpIDs: 0
  }),
  components: {
    Mirror
  },
  props: {
    streamID: {
      type: String,
      required: true
    },
    preview: Boolean,
    showMirror: Boolean
  },
  computed: {
    swatchesToShow() {
      return this.swatches.slice().reverse();
    }
  },
  methods: {
    rgbaToHex,
    invertColor,
    toRelativeTime(time) {
      return timeAgo.format(new Date(time), "twitter-minute-now"); // TODO how to make this reactive
    },
    selectSwatch(id) {
      if (id == this.selectedSwatch) this.selectedSwatch = -1;
      else this.selectedSwatch = id;
    },
    addSwatch(swatch) {
      swatch.forEach((color, index) => {
        swatch[index] = this.rgbaToHex(color);
      });

      const swatchObj = {
        colors: swatch,
        creator: this.creatorID,
        id: "tmpID_" + this.tmpIDs
      };
      this.tmpIDs++;

      this.swatches.push(swatchObj);
      this.selectedSwatch = swatchObj.id;

      axios
        .post(
          process.env.VUE_APP_API_SERVER + "/" + this.streamID + "/swatches",
          swatchObj
        )
        .catch(function(error) {
          // handle error
          console.log(error);
        });
    },
    receiveMsg(event) {
      console.log(event.data);

      const msg = JSON.parse(event.data);
      console.log(msg);
      if (msg.creator != this.creatorID) this.swatches.push(msg);
    },
    uuidv4() {
      // Not super collision safe but good enough for now
      return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, function(
        c
      ) {
        const r = (Math.random() * 16) | 0,
          v = c == "x" ? r : (r & 0x3) | 0x8;
        return v.toString(16);
      });
    }
  },
  mounted() {
    this.isLoading = true;
    axios
      .get(process.env.VUE_APP_API_SERVER + "/" + this.streamID + "/swatches")
      .then(response => {
        this.swatches = response.data.swatches;
        if (this.swatches == null) this.swatches = [];
        this.isLoading = false;
      })
      .catch(function(error) {
        // handle error
        console.log(error);
      });

    this.creatorID = this.uuidv4();

    this.socket = new WebSocket(process.env.VUE_APP_WS_SERVER);
    this.socket.onmessage = this.receiveMsg;
  }
};
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

.squash > .color-field {
  margin-bottom: 2px;
}

.color-field {
  flex-grow: 1;
  margin-bottom: 10px;
  cursor: pointer;
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
  text-transform: uppercase;
}

.color-info.hidden {
  opacity: 0;
}

.large {
  width: 300px;
}

/* .color-column:hover {
  width: 200px;
} */
</style>
