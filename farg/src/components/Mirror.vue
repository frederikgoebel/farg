<template>
<canvas id="canvas"></canvas>
</template>

<script>
export default {
  data: () => ({
    renderLayer: null,
    renderCanvas: null,
  }),
  methods: {
    draw() {
      this.resize(this.renderCanvas);
      this.renderLayer.clearRect(0, 0, canvas.clientWidth, canvas.clientHeight);
      this.renderLayer.rect(0, 0, 100, 100);
      this.renderLayer.fill();
      window.requestAnimationFrame(this.draw);
    },
    resize(canvas) {
      // look up the size the canvas is being displayed
      const width = canvas.clientWidth;
      const height = canvas.clientHeight;

      // If it's resolution does not match change it
      if (canvas.width !== width || canvas.height !== height) {
        canvas.width = width;
        canvas.height = height;
      }
    },
  },
  mounted() {
    this.renderCanvas = document.getElementById("canvas");
    this.renderLayer = this.renderCanvas.getContext("2d");
    window.requestAnimationFrame(this.draw);
  },
}
</script>

<style>
#canvas {
  height: 100%;
  width: 30%;
}
</style>
