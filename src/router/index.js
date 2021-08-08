import Vue from 'vue'
import VueRouter from 'vue-router'
import Home from '../views/Home.vue'
import Send from '../views/Send.vue'
import Decrypt from '../views/Decrypt.vue'
import Miner from '../views/Miner.vue'
import Encrypt from '../views/Encrypt.vue'

Vue.use(VueRouter)

const routes = [
  {
    path: '/',
    name: 'Home',
    component: Home
  },
  {
    path: '/send',
    name: 'Send',
    component: Send
  },
  {
    path: '/decrypt',
    name: 'Decrypt',
    component: Decrypt
  },
  {
    path: '/encrypt',
    name: 'Encrypt',
    component: Encrypt
  },
  {
    path: '/miner',
    name: 'Miner',
    component: Miner
  }
]

const router = new VueRouter({
  mode: 'history',
  base: process.env.BASE_URL,
  routes
})

export default router
