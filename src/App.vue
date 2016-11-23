<template>
  <div id="app">
    <div class="status">
      <transition name="fade">
        <div v-if="failed == true || userEmpty">
          <h1>- GanttLab -</h1>
          <h2>The easy to use, fully functional Gantt chart for GitLab.</h2>
          <p class="input"><span>GitLab instance URL</span><input v-model="url" v-on:keyup.enter="init"></p>
          <p class="input"><span>Your Auth Token</span><input v-model="token" v-on:keyup.enter="init"></p>
          <p class="helper">Use your <a v-bind:href="privateTokenLink" target="_blank" title="/profile/account">Private Token</a>, or a <a v-bind:href="personalTokenLink" target="_blank" title="/profile/personal_access_tokens">Personal Access Token</a></p>
          <p v-if="hasLocalStorage" class="input remember"><input type="checkbox" v-model="rememberMe"> <span>Remember me <i class="fa fa-question-circle" aria-hidden="true" title="Don't do that on a public computer!"></i></span> <button v-on:click="init">Sign-in</button></p>
          <p v-if="userEmpty && downloading" class="downloading"><strong><i v-if="downloading" class="fa fa-circle-o-notch fa-spin" aria-hidden="true"></i> Connecting to {{ url }}</strong></p>
          <p v-if="failed == true" class="error">Unable to connect to {{ url }}</p>
          <p class="more"><a href="https://gitlab.com/ganttlab/ganttlab-live" target="_blank">Read more about GanttLab<i class="fa fa-external-link"></i></a></p>
          <p class="copyright">&copy; 2016 - <a href="http://clorichel.com/" target="_blank">Pierre-Alexandre Clorichel</a></p>
        </div>
      </transition>
    </div>
    <transition name="fade">
      <div v-if="!userEmpty">
        <div id="top" class="standardpadding">
          <div v-if="!userEmpty">
            <span class="user"><img v-bind:src="GitLab.user.avatar_url"> {{ GitLab.user.name }}</span>
            <span class="server"><transition name="fade"><i v-if="downloading" class="fa fa-circle-o-notch fa-spin downloading" aria-hidden="true"></i></transition> <a v-bind:href="url" target="_blank">{{ url }}</a> <a href="https://gitlab.com/ganttlab/ganttlab-live#how-it-works" target="_blank"><i class="fa fa-question-circle" aria-hidden="true" title="Help"></i></a> <i class="fa fa-times close" aria-hidden="true" v-on:click="logout" title="Close"></i></span>
          </div>
        </div>
        <selectorWrapper v-bind:user="GitLab.user" v-bind:downloading="downloading"></selectorWrapper>
      </div>
    </transition>
  </div>
</template>

<script>
import SelectorWrapper from './components/SelectorWrapper'
import 'font-awesome/css/font-awesome.css'

export default {
  name: 'app',
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
  components: {
    SelectorWrapper
  },
  methods: {
    getGitLabUser: function (event) {
      this.GitLabAPI.get('/user', [], [this.GitLab, 'user'], (response) => {
        this.failed = true
      })
    },
    init: function (event) {
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
  computed: {
    userEmpty: function () {
      return !(this.GitLab.hasOwnProperty('user') && this.GitLab.user.hasOwnProperty('name'))
    },
    downloading: function () {
      if (typeof this.$store.state.GitLabAPI !== 'undefined') {
        return this.$store.state.GitLabAPI.downloading
      } else {
        return false
      }
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
  mounted: function () {
    this.GitLabAPI.registerStore(this.$store)
    if (this.hasLocalStorage) {
      this.url = window.localStorage.getItem('url') || process.env.GITLAB_URL
      this.token = window.localStorage.getItem('token') || process.env.GITLAB_TOKEN
      this.rememberMe = Boolean(window.localStorage.getItem('rememberMe') || false)
    }
    if (this.url && this.token) {
      this.init()
    }
  }
}
</script>

<style>
body {
  margin: 0;
  padding: 0;
}
#app {
  font-family: 'Avenir', Helvetica, Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  color: #2c3e50;
  margin: 0;
  padding: 0;
}
a {
  color: #2c3e50;
  text-decoration: none;
}
a:hover {
  text-decoration: underline;
}
.status {
  font-size: 20px;
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translateX(-50%) translateY(-50%);
}
.status h1 {
  font-size: 1.2em;
  text-align: center;
  margin-bottom: 0px;
}
.status h2 {
  font-size: 0.7em;
  font-style: italic;
  text-align: center;
  margin-top: 5px;
  margin-bottom: 24px;
}
.status p {
  text-align: center;
}
.status .error,
.status .downloading {
  margin-top: 30px;
  font-size: 0.80em;
}
.status .error {
  color: #a94442;
}
.status .input span {
  font-size: 0.85em;
  width: 150px;
  display: inline-block;
}
.status .input {
  font-size: 0.9em;
}
.status .input input {
  width: 175px;
  font-family: 'Avenir', Helvetica, Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  font-size: 0.9em;
  border: 1px solid #d7dbdd;
  color: #2c3e50;
}
.status .input .remember {
  text-align: center;
}
.status .input.remember span {
  width: auto;
}
.status .input.remember input {
  width: auto;
}
.status .input.remember button {
  background-color: #fff;
  border: 1px solid #d7dbdd;
  border-radius: 4px;
  display: inline-block;
  font-size: 0.8em;
  padding: 4px 1em;
  text-align: center;
  cursor: pointer;
  margin-left: 60px;
}
.status .input.remember button:hover {
  background-color: #ebedee;
}
.helper {
  font-size: 0.60em;
  margin-top: -12px;
  font-style: italic;
}
.helper a {
  border-bottom: 1px dotted #2c3e50;
}
.helper a:hover {
  border-bottom: 1px solid #2c3e50;
  text-decoration: none;
}
.more {
  margin-top: 30px;
  font-size: 0.75em;
}
.more i {
  margin-left: 5px;
}
.copyright {
  font-size: 0.60em;
  margin-top: -12px;
}
#top {
  margin: 0;
  background-color:#fafafa;
  top: 0;
  left: 0;
  height: 26px;
  line-height: 26px;
}
#top p {
  margin: 0px;
}
#top .server i {
  cursor: pointer;
  margin-left: 10px;
}
#top .server {
  position: absolute;
  right: 10px;
}
#top .user img {
  vertical-align: middle;
  margin-right: 10px;
  height: 26px;
}
.standardpadding {
  padding: 10px;
}
.fade-enter-active, .fade-leave-active {
  transition: opacity .5s
}
.fade-enter, .fade-leave-active {
  opacity: 0
}
</style>
