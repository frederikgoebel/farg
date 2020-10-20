<template>
<div id="app" class="container">
  <header class="header container lower-line">
    <div class="container">
      <img class="logo" src="./assets/farg_logo.png">
      <h1 class="page-title">FÄRG</h1>
    </div>
    <nav class="right menu-box">
      <router-link to="/">Feed</router-link>
      <router-link to="/about">About</router-link>
    </nav>
  </header>
  <router-view></router-view>
</div>
</template>

<script>
export default {
  name: 'app',
}
</script>

<style scoped>
</style>
