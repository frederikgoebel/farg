<template>
<transition-group name="stream" tag="div" id="color-stream" class="row">
  <div v-for="(swatch, index) in swatches" :key="`swatch-${index}`" class="color-column">
    <div v-for=" (color, index) in swatch" :key="`color-${index}`" class="color-field" :style="{background:  color  }">
    </div>
  </div>
</transition-group>
</template>

<script>
export default {
  components: {},
  props: {
    swatches: Array,
  },
}
</script>

<style>
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
  display: flex;
  flex-direction: column;
}

.color-field {
  flex-grow: 1;
  background: red;
}

.stream-enter {
  flex-grow: 0.0000001;
}

.color-column:hover {
  width: 200px;
}
</style>
