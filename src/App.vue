<template>
  <div id="app">
    <p v-if="connected == -1"><i class="fa fa-circle-o-notch fa-spin" aria-hidden="true"></i> Connecting to GitLab...</p>
    <p v-if="connected == false">Unable to connect to GitLab!</p>
    <p v-if="currentUser">Connected to GitLab as <code>{{ currentUser.username }}</code>.</p>
    <selectorWrapper v-bind:currentUser="currentUser" v-bind:GitLab="GitLab"></selectorWrapper>
  </div>
</template>

<script>
import SelectorWrapper from './components/SelectorWrapper'
import 'font-awesome/css/font-awesome.css'

export default {
  name: 'app',
  data () {
    return {
      GitLab: null,
      currentUser: null,
      connected: -1
    }
  },
  components: {
    SelectorWrapper
  },
  methods: {
    getCurrentUser: function (event) {
      this.$http.get(
        this.GitLab + '/user',
        {
          headers: { 'PRIVATE-TOKEN': process.env.GITLAB_PRIVATE_TOKEN }
        }
      ).then((response) => {
        // Assigning response body directly to this.groups
        this.currentUser = response.body
        this.connected = true
      }, (response) => {
        this.connected = false
      })
    }
  },
  mounted: function () {
    this.GitLab = process.env.GITLAB_URL + '/api/v3'
    this.getCurrentUser()
  }
}
</script>

<style>
#app {
  font-family: 'Avenir', Helvetica, Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  color: #2c3e50;
}
</style>
