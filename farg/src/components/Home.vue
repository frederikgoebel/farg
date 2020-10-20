<template>
<div class="item-100 container">
  <div class="feature-stream lower-line">
    <Stream streamID="debug" />
    <TitleCard>
      <span class="live-bullet"></span>Live from <b>Visual Arena</b>
    </TitleCard>
  </div>
  <div class="container item-100 lower-line pt-64 pl-64 pr-64">
    <h2>Newest color streams</h2>
    <a>Add own stream</a>
  </div>
  <div class="container item-100 ">
    <div class="feed-item item-25 lower-line container-v">
      <Stream preview streamID="debugsdd" />
      <div class="info-box">Hugo</div>
    </div>
    <div class="feed-item item-25 lower-line">
      <Stream preview streamID="debug" />
      <TitleCard>
        Live from <b>Visual Arena</b>
      </TitleCard>
    </div>
    <div class="feed-item item-25 lower-line">
      <Stream preview streamID="debug" />
      <TitleCard>
        Live from <b>Visual Arena</b>
      </TitleCard>
    </div>
    <div class="feed-item item-25 lower-line">
      <Stream preview streamID="debug" />
      <TitleCard>
        Live from <b>Visual Arena</b>
      </TitleCard>
    </div>
    <div class="feed-item item-25 lower-line">
      <Stream preview streamID="debug" />
      <TitleCard>
        Live from <b>Visual Arena</b>
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
</style>
