<template>
<div class="item-100 container presentation-frame">
  <div class="feature-stream">
    <Stream streamID="debug" preview showMirror autoLoadMirror />
  </div>
</div>
</template>

<script>
import Stream from "./Stream.vue";
import Mirror from "./Mirror.vue";

export default {
  components: {
    Stream,
    Mirror
  }
};
</script>

<style scoped>
.presentation-frame {
  cursor: none;
}

.feature-stream {
  height: 100vh;
  width: 100%;
  display: flex;
  position: relative;
}
</style>
