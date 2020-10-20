<template>
<div class="item-100 container">
  <div class="feature-stream lower-line">
    <Stream streamID="debug" />
    <TitleCard>
      <BlinkyDot />Live from <b>Visual Arena</b>
    </TitleCard>
  </div>
</div>

<!-- <Mirror @swatchAdded="addSwatch" />

  <div id="image-loader" /> -->
</div>
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
  height: 80vh;
  width: 100%;
  display: flex;
  position: relative;
}
</style>
