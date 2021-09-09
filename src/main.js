import Vue from 'vue'
import App from './App.vue'
import router from './router'
import store from './store'
import moment from 'moment'

Vue.config.productionTip = false

Vue.filter('df', function (date) {
  if (!date) return ''
  return moment(date*1000).format('L LTS')
})

Vue.filter('num', function (val) {
  if (!val) return null
  return Number(val).toFixed(8)
})

new Vue({
  router,
  store,
  render: h => h(App)
}).$mount('#app')
