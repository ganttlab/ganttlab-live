<template>
  <div id="App">
    <transition name="fade">
      <div v-if="failed == true || userEmpty" id="LoginScreen">
          <h1>GanttLab Live</h1>

          <div class="row">
            <div class="col welcome">
              <div class="pad">
                <h2>The easy to use, fully functional
                <br/>Gantt chart for GitLab.</h2>
                <p>Provide your teams with the right tool to master time and deadlines. Giving back credit to your project status and issues due dates has never been easier!</p>
                <p v-if="userEmpty && downloading" class="downloading"><strong><i v-if="downloading" class="fa fa-circle-o-notch fa-spin" aria-hidden="true"></i> Connecting to {{ url }}</strong></p>
                <p v-if="failed == true" class="error"><i class="fa fa-exclamation-triangle"></i> Unable to connect to {{ url }}</p>
              </div>
            </div>

            <div class="col form">
              <p class="form-input first">
                <input tabindex="1" v-model="url" v-on:keyup.enter="signin" autofocus>
              </p>
              <p class="helper">Your GitLab instance URL</p>
              <p class="form-input">
                <input tabindex="2" v-model="token" v-on:keyup.enter="signin">
              </p>
              <p class="helper">Use your <a v-bind:href="privateTokenLink" target="_blank" title="/profile/account">Private Token</a>, or a <a v-bind:href="personalTokenLink" target="_blank" title="/profile/personal_access_tokens">Personal Access Token</a></p>

              <p v-if="hasLocalStorage" class="form-input remember"><input tabindex="3" type="checkbox" v-model="rememberMe"> <span>Remember me <i class="fa fa-question-circle-o" aria-hidden="true" title="Don't do that on a public computer!"></i></span> <button tabindex="4" v-on:click="signin">Sign-in &nbsp;&gt;</button></p>
            </div>
          </div>

          <div class="more"></div>

          <div class="row">
            <div class="col copy">
              <div class="pad">
                <p><a href="https://www.ganttlab.org" target="_blank">Read more about GanttLab<i class="fa fa-external-link"></i></a></p>
                <p class="copyright">&copy; 2016 <a href="http://clorichel.com/" target="_blank">Pierre-Alexandre Clorichel</a></p>
              </div>
            </div>

            <div class="col social">
              <div class="pad">
                <p class="first"><a href="https://twitter.com/GanttLab" target="_blank">Twitter</a></p>
                <p><a href="https://www.facebook.com/GanttLab-324440334610008/" target="_blank">Facebook</a></p>
              </div>
            </div>
          </div>
      </div>
    </transition>
    <transition name="fade">
      <div v-if="!userEmpty" id="MainScreen">
        <div id="top" class="standardpadding">
          <div v-if="!userEmpty">
            <span class="user"><img v-bind:src="GitLab.user.avatar_url"> {{ GitLab.user.name }}</span>
            <span class="server"><transition name="fade"><i v-if="downloading" class="fa fa-circle-o-notch fa-spin downloading" aria-hidden="true"></i></transition> <a v-bind:href="url" target="_blank">{{ url }}</a> <a href="https://gitlab.com/ganttlab/ganttlab-live#how-it-works" target="_blank"><i class="fa fa-question-circle" aria-hidden="true" title="Help"></i></a> <i class="fa fa-times close" aria-hidden="true" v-on:click="logout" title="Close"></i></span>
          </div>
        </div>
        <mainFilter v-bind:user="GitLab.user"></mainFilter>
      </div>
    </transition>
  </div>
</template>

<script>
import SharedStates from './mixins/SharedStates'
import MainFilter from './components/MainFilter'
import 'font-awesome/css/font-awesome.css'

export default {
  name: 'app',
  mixins: [
    SharedStates
  ],
  components: {
    MainFilter
  },
  data () {
    return {
      rememberMe: false,
      url: process.env.GITLAB_URL,
      token: process.env.GITLAB_TOKEN,
      GitLab: {
        user: {} // need to be defined here, or computed property won't work as expected
      },
      failed: false
    }
  },
  computed: {
    userEmpty: function () {
      return !(this.GitLab.hasOwnProperty('user') && this.GitLab.user.hasOwnProperty('name'))
    },
    safeUrl: function () {
      return this.url.replace(/\/$/, '')
    },
    privateTokenLink: function () {
      return this.safeUrl + '/profile/account'
    },
    personalTokenLink: function () {
      return this.safeUrl + '/profile/personal_access_tokens'
    },
    hasLocalStorage: function () {
      return typeof Storage !== 'undefined'
    }
  },
  methods: {
    getGitLabUser: function (event) {
      this.GitLabAPI.get('/user', [], [this.GitLab, 'user'], (response) => {
        this.failed = true
      })
    },
    signin: function (event) {
      this.GitLab.user = {}
      this.failed = false
      this.GitLabAPI.setUrl(this.url)
      this.GitLabAPI.setToken(this.token)
      this.getGitLabUser()
      if (this.hasLocalStorage) {
        if (this.rememberMe) {
          window.localStorage.url = this.url
          window.localStorage.token = this.token
          window.localStorage.rememberMe = this.rememberMe
        } else {
          window.localStorage.removeItem('url')
          window.localStorage.removeItem('token')
          window.localStorage.removeItem('rememberMe')
        }
      }
    },
    logout: function (event) {
      window.history.pushState(null, null, '/')
      this.GitLab.user = {}
      this.failed = false
      if (!this.rememberMe) {
        this.token = ''
        if (this.hasLocalStorage) {
          window.localStorage.removeItem('url')
          window.localStorage.removeItem('token')
          window.localStorage.removeItem('rememberMe')
        }
      }
    }
  },
  mounted: function () {
    this.GitLabAPI.registerStore(this.$store)
    if (this.hasLocalStorage) {
      this.url = window.localStorage.getItem('url') || process.env.GITLAB_URL
      this.token = window.localStorage.getItem('token') || process.env.GITLAB_TOKEN
      this.rememberMe = Boolean(window.localStorage.getItem('rememberMe') || false)
    }
    if (this.url && this.token) {
      this.signin()
    }
  }
}
</script>

<style src="./assets/styles/ganttlab.scss" lang="scss"></style>