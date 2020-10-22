<template>
<div class="item-100 container fill-height">
  <div class="feature-stream lower-line">
    <Stream streamID="debug" showMirror />
    <!-- <TitleCard>
      <BlinkyDot />Live from <b>Visual Arena</b>
    </TitleCard> -->
  </div>
</div>

<!-- <Mirror @swatchAdded="addSwatch" />

  <div id="image-loader" /> -->
</template>


<script>
import Stream from './Stream.vue'
import Mirror from './Mirror.vue'
import TitleCard from './TitleCard.vue'
import BlinkyDot from './BlinkyDot.vue'

export default {
  components: {
    Stream,
    Mirror,
    TitleCard,
    BlinkyDot
  },
}
</script>

<style scoped>
.feature-stream {
  height: 100%;
  width: 100%;
  display: flex;
}

.fill-height {
  flex: 1;
  height: 90%;
  align-content: stretch;
}
</style>
