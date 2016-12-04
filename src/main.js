import Vue from 'vue'

import Vuex from 'vuex'
Vue.use(Vuex)

import VueResource from 'vue-resource'
Vue.use(VueResource)

import GitLabAPI from 'vue-gitlab-api'
Vue.use(GitLabAPI)

import App from './App'

const store = new Vuex.Store({
  state: {
    user: {
      name: null,
      avatarUrl: null
    },
    tasks: null,
    pagination: {
      page: 1,
      perPage: 100,
      links: {
        prev: null,
        next: null
      }
    }
  },
  mutations: {
    user: function (state, value) {
      state.user = value
    },
    tasks: function (state, value) {
      state.tasks = value
    },
    pagination: function (state, value) {
      state.pagination = value
    }
  }
})

/* eslint-disable no-new */
new Vue({
  el: '#app',
  template: '<App/>',
  components: { App },
  store
})
