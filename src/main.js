import Vue from 'vue'

import VueResource from 'vue-resource'
Vue.use(VueResource)

import GitLabAPI from 'vue-gitlab-api'
Vue.use(GitLabAPI)

import App from './App'

/* eslint-disable no-new */
new Vue({
  el: '#app',
  template: '<App/>',
  components: { App }
})
