<template>
<div class="item-100 container">
  <div class="feature-stream lower-line">
    <Stream streamID="debug" />
    <TitleCard>
      <span class="live-bullet"></span>Live from <b>Visual Arena</b>
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

export default {
  components: {
    Stream,
    Mirror,
    TitleCard,
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

.live-bullet {
  border-radius: 90px;
  width: 0.7rem;
  height: 0.7rem;
  display: inline-block;
  background: #6FDA67;
  margin-right: 20px;
}

.live-bullet::before {
  content: '';
}
</style>
