<template>
<span class="live-bullet"></span>
</template>

<script>
export default {
  data: () => ({

  })
}
</script>

<style scoped>
.live-bullet {
  border-radius: 90px;
  width: 0.7rem;
  height: 0.7rem;
  display: inline-block;
  background: #6FDA67;
  margin-right: 20px;
  animation: 1.5s blink ease infinite;
}

.live-bullet::before {
  content: '';

}

@keyframes blink {

  from,
  to {
    opacity: 0.3;
  }

  50% {
    opacity: 1;
  }
}
</style>
