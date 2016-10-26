import Vue from 'vue'

import Vuex from 'vuex'
Vue.use(Vuex)

import VueResource from 'vue-resource'
Vue.use(VueResource)

import GitLabAPI from 'vue-gitlab-api'
Vue.use(GitLabAPI)

import App from './App'

const store = new Vuex.Store({})

/* eslint-disable no-new */
new Vue({
  el: '#app',
  template: '<App/>',
  components: { App },
  store
})
