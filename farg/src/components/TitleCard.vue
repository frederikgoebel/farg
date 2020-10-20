<template>
<div class="title-card">
  <slot></slot>
</div>
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
.title-card {
  position: absolute;
  left: 60px;
  bottom: 80px;
  background: white;
  color: black;
  padding: 10px 20px;
  border-radius: 6px;
  font-size: 0.9rem;

}
</style>
