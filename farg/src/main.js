import Vue from 'vue'
import App from './App.vue'
import "./assets/style.css"
import VueRouter from 'vue-router'

import Home from './components/Home'
import About from './components/About'

Vue.config.productionTip = false

Vue.use(VueRouter)
const routes = [
  {
    path: '/',
    component: Home
  },
  {
    path: '/about',
    component: About
  },
  {
    path: '/presentation',
    component: Home
  },
]

const router = new VueRouter({
  routes // short for `routes: routes`
})




new Vue({
  router,
  render: h => h(App),
}).$mount('#app')
