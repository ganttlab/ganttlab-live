<template>
  <div id="App">
    <transition name="fade">
      <div v-if="useLegacy === false" id="NewGanttLab">
        <div>
          <h1>GanttLab got better!</h1>
          <p><iframe id="ytplayer" type="text/html" width="400" height="225" src="https://www.youtube.com/embed/mk0OseE61H0" frameborder="0" allowfullscreen /></p>
          <p class="tweet"><a href="https://twitter.com/GanttLab" target="_blank">Latest announcements <i class="fa fa-twitter"></i></a></p>
          <p class="links"><a class="stick" href="#" v-on:click.prevent="useLegacy = true">Stick to Legacy</a><a class="rediscover" href="https://app.ganttlab.org/">Rediscover GanttLab &nbsp;&gt;</a></p>
        </div>
      </div>
      <div v-if="useLegacy && (loginFailed || !userName)" id="LoginScreen">
        <h1>GanttLab Live<span class="timezone"><i class="fa fa-clock-o"></i> {{ timezone }}</span></h1>

        <div class="row">
          <div class="col welcome">
            <div class="pad">
              <h2>The easy to use, fully functional
              <br/>Gantt chart for GitLab and GitHub.</h2>
              <p>Provide your teams with the right tool to master time and deadlines. Giving back credit to your project status and issues due dates has never been easier!</p>
              <p v-if="!userName && downloading" class="downloading"><strong><i v-if="downloading" class="fa fa-circle-o-notch fa-spin" aria-hidden="true"></i> Connecting to {{ url }}</strong></p>
              <p v-if="loginFailed" class="error"><i class="fa fa-exclamation-triangle"></i> Unable to connect to {{ url }}</p>
            </div>
          </div>

          <div class="col form">
            <p class="providerchoice"><i class="fa fa-gitlab" v-bind:class="{ selected: isGitLab }" v-on:click="providerName = 'GitLab'"></i><span> or </span><i class="fa fa-github" v-bind:class="{ selected: !isGitLab }" v-on:click="providerName = 'GitHub'"></i></p>
            <p class="form-input first">
              <input tabindex="1" v-model="url" v-on:keyup.enter="signin" v-bind:disabled="providerName != 'GitLab'" v-bind:class="{ disabled: providerName != 'GitLab' }" autofocus>
            </p>
            <p class="helper" v-bind:class="{ disabled: providerName != 'GitLab' }">Your GitLab instance URL</p>
            <p class="form-input">
              <input tabindex="2" v-model="token" v-on:keyup.enter="signin">
            </p>
            <p v-if="providerName == 'GitLab'" class="helper">Use your <a v-bind:href="privateTokenLink" target="_blank" title="/profile/account">Private Token</a>, or a <a v-bind:href="personalTokenLink" target="_blank" title="/profile/personal_access_tokens">Personal Access Token</a></p>
            <p v-else class="helper">Use one of your <a href="https://github.com/settings/tokens" target="_blank" title="https://github.com/settings/tokens">Personal Access Tokens</a></p>

            <p v-if="hasLocalStorage" class="form-input remember"><input tabindex="3" type="checkbox" v-model="rememberMe"> <span>Remember me <i class="fa fa-question-circle-o" aria-hidden="true" title="Don't do that on a public computer!"></i></span> <button tabindex="4" v-on:click="signin">Sign-in &nbsp;&gt;</button></p>
          </div>
        </div>

        <div class="more"></div>

        <div class="row">
          <div class="col copy">
            <div class="pad">
              <p><a href="https://www.ganttlab.org" target="_blank">Read more about GanttLab<i class="fa fa-external-link"></i></a></p>
              <p class="copyright">&copy; 2016-2020 <a href="http://clorichel.com/" target="_blank">Pierre-Alexandre Clorichel</a></p>
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
      <div v-if="useLegacy && userName" id="MainScreen">
        <div id="top" class="standardpadding">
          <div v-if="userName">
            <span class="user"><img v-bind:src="userAvatarUrl"> {{ userName }}</span>
            <span class="server"><transition name="fade"><i v-if="downloading" class="fa fa-circle-o-notch fa-spin downloading" aria-hidden="true"></i></transition> <a v-bind:href="url" target="_blank">{{ url }}</a> <a href="https://gitlab.com/ganttlab/ganttlab-live#how-it-works" target="_blank"><i class="fa fa-question-circle" aria-hidden="true" title="Help"></i></a> <i class="fa fa-times close" aria-hidden="true" v-on:click="logout" title="Close"></i></span>
          </div>
        </div>

        <component v-bind:is="provider" class="provider"></component>

        <div class="standardpadding">
          <p v-if="downloading" class="downloading"><i class="fa fa-circle-o-notch fa-spin" aria-hidden="true"></i></p>

          <gantt v-if="tasks != null"></gantt>
        </div>

        <div v-if="! downloading && (this.paginationLinks.prev || this.paginationLinks.next)" class="pagination">
          <button v-if="this.paginationLinks.prev" v-on:click="paginationPage--">&lt; Prev</button>
          <span>Page {{ this.paginationPage }}</span>
          <button v-if="this.paginationLinks.next" v-on:click="paginationPage++">Next &gt;</button>
          <div class="perpage">
            Showing
            <select v-model="paginationPerPage">
              <option v-for="value in [10,20,50,75,100]" v-bind:value="value">{{ value }}</option>
            </select>
            issues per page
          </div>
        </div>
      </div>
    </transition>
  </div>
</template>

<script>
import SharedStates from './mixins/SharedStates'
import Gantt from './components/Gantt'
import 'font-awesome/css/font-awesome.css'

export default {
  name: 'app',
  mixins: [
    SharedStates
  ],
  components: {
    Gantt
  },
  data () {
    return {
      useLegacy: false,
      rememberMe: false,
      providerName: 'GitLab',
      provider: null
    }
  },
  computed: {
    isGitLab: function () {
      return this.providerName === 'GitLab'
    },
    safeUrl: function () {
      if (this.url == null) {
        return null
      }
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
      this.GitLabAPI.get('/user', [], (response) => {
        this.userName = response.body.name
        this.userAvatarUrl = response.body.avatar_url
        this.provider = require('./components/providers/GitLab')
      }, (response) => {
        this.loginFailed = true
      })
    },
    getGitHubUser: function (event) {
      this.GitHubAPI.get('/user', [], (response) => {
        this.userName = response.body.login
        this.userAvatarUrl = response.body.avatar_url
        this.provider = require('./components/providers/GitHub')
      }, (response) => {
        this.loginFailed = true
      })
    },
    signin: function (event) {
      this.userName = null
      this.userAvatarUrl = null
      this.loginFailed = false
      if (this.providerName === 'GitLab') {
        this.GitLabAPI.registerStore(this.$store)
        this.GitLabAPI.setUrl(this.url)
        this.GitLabAPI.setToken(this.token)
        this.getGitLabUser()
      } else {
        this.GitHubAPI.registerStore(this.$store)
        this.GitHubAPI.setToken(this.token)
        this.getGitHubUser()
        this.url = 'https://github.com'
      }
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
      this.userName = null
      this.userAvatarUrl = null
      this.loginFailed = false
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
    this.timezone = process.env.MOMENTJS_TIMEZONE
    this.url = process.env.GITLAB_URL
    this.token = process.env.GITLAB_TOKEN
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

<style src="vue-multiselect/dist/vue-multiselect.min.css"></style>
<style src="./assets/styles/ganttlab.scss" lang="scss"></style>
