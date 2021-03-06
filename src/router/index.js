import Vue from 'vue'
import VueRouter from 'vue-router'
import Home from '../views/Home.vue'
import Send from '../views/Send.vue'
import Miner from '../views/Miner.vue'
import Encrypt from '../views/Encrypt.vue'
import Verify from '../views/Verify.vue'
import Settings from '../views/Settings.vue'
import Info from '../views/Info.vue'
import About from '../views/About.vue'
import Peers from '../views/Peers.vue'
import Masternodes from '../views/Masternodes.vue'
import Sign from '../views/Sign.vue'
import ImportPrivateKey from '../views/ImportPrivateKey.vue'

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
    path: '/encrypt',
    name: 'Encrypt',
    component: Encrypt
  },
  {
    path: '/miner',
    name: 'Miner',
    component: Miner
  },
  {
    path: '/verify',
    name: 'Verify',
    component: Verify
  },
  {
    path: '/settings',
    name: 'Settings',
    component: Settings
  },
  {
    path: '/info',
    name: 'Info',
    component: Info
  },
  {
    path: '/peers',
    name: 'Peers',
    component: Peers
  },
  {
    path: '/masternodes',
    name: 'Masternodes',
    component: Masternodes
  },
  {
    path: '/sign',
    name: 'Sign',
    component: Sign
  },
  {
    path: '/about',
    name: 'About',
    component: About
  },
  {
    path: '/import_pk',
    name: 'ImportPrivateKey',
    component: ImportPrivateKey
  }
]

const router = new VueRouter({
  mode: 'hash',
  base: process.env.BASE_URL,
  routes
})

export default router
