<template>
<div id="app">
  <header v-if="showHeader" class="header container lower-line">
    <router-link to="/" exact>
      <div class="container">
        <img class="logo" src="./assets/farg_logo.png">
        <h1 class="page-title">FÄRG</h1>
      </div>
    </router-link>
    <nav class="right menu-box">
      <router-link to="/" exact>Feed</router-link>
      <router-link to="/about">About</router-link>
    </nav>
  </header>
  <router-view></router-view>
</div>
</template>

<script>
export default {
  name: 'app',
  data: () => ({}),
  computed: {
    showHeader() {
      return this.$route.path != "/presentation"
    }
  }
}
</script>

<style scoped>
#app {
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
}

.header {
  height: 90px;
  padding: 0 64px 0 64px;
  width: 100%;
  overflow: hidden;
  min-width: min-content;
  justify-content: space-between;
  flex-shrink: 0;
}

@media (max-width:600px) {
  .header {
    height: 70px;
    padding: 0 16px 0 16px;
  }
}

.page-title {
  font-size: 1.4rem;
  letter-spacing: 0.5rem;
}

.logo {
  height: 2rem;
  margin-right: 16px;
}

.menu-box>a {
  padding-right: 12px;
  padding-left: 12px;
}

.menu-box>a:last-child {
  padding-right: 0;
}

.menu-box>a:first-child {
  padding-left: 0;
}

nav .router-link-exact-active {
  text-decoration: underline;
}
</style>