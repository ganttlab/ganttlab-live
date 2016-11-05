<template>
  <div id="app">
    <div class="status">
      <transition name="fade">
        <div v-if="failed == true || userEmpty">
          <h1>- GanttLab -</h1>
          <h2>An easy to use, fully functional Gantt chart for GitLab.</h2>
          <p class="input"><span>GitLab instance URL</span><input v-model="url" v-on:keyup.enter="init"></p>
          <p class="input"><span>Your Auth Token</span><input v-model="token" v-on:keyup.enter="init"></p>
          <p class="helper">Use your <a v-bind:href="privateTokenLink" target="_blank" title="/profile/account">Private Token</a>, or a <a v-bind:href="personalTokenLink" target="_blank" title="/profile/personal_access_tokens">Personal Access Token</a></p>
          <p v-if="userEmpty && downloading" class="downloading"><strong><i v-if="downloading" class="fa fa-circle-o-notch fa-spin" aria-hidden="true"></i> Connecting to {{ url }}</strong></p>
          <p v-if="failed == true" class="error">Unable to connect to {{ url }}</p>
          <p class="more"><a href="https://gitlab.com/clorichel/ganttlab" target="_blank">Read more about GanttLab<i class="fa fa-external-link"></i></a></p>
          <p class="copyright">&copy; 2016 - <a href="http://clorichel.com/" target="_blank">Pierre-Alexandre Clorichel</a></p>
        </div>
      </transition>
    </div>
    <transition name="fade">
      <div v-if="!userEmpty">
        <div id="top" class="standardpadding">
          <div v-if="!userEmpty">
            <span class="user"><img v-bind:src="GitLab.user.avatar_url"> {{ GitLab.user.name }}</span>
            <span class="server"><transition name="fade"><i v-if="downloading" class="fa fa-circle-o-notch fa-spin downloading" aria-hidden="true"></i></transition> <a v-bind:href="url" target="_blank">{{ url }}</a> <a href="https://gitlab.com/clorichel/ganttlab#how-it-works" target="_blank"><i class="fa fa-question-circle" aria-hidden="true" title="Help"></i></a> <i class="fa fa-times close" aria-hidden="true" v-on:click="reset" title="Close"></i></span>
          </div>
        </div>
        <selectorWrapper class="standardpadding" v-bind:user="GitLab.user" v-bind:downloading="downloading"></selectorWrapper>
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
    },
    reset: function (event) {
      this.GitLab.user = {}
      this.failed = false
      this.token = ''
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
    }
  },
  mounted: function () {
    this.GitLabAPI.registerStore(this.$store)
    if (this.url && this.token) {
      this.init()
    }
    if (process.env.NODE_ENV === 'production' && process.env.GA_TRACKING_CODE) {
      /* eslint-disable */
      (function(i,s,o,g,r,a,m){i['GoogleAnalyticsObject']=r;i[r]=i[r]||function(){
      (i[r].q=i[r].q||[]).push(arguments)},i[r].l=1*new Date();a=s.createElement(o),
      m=s.getElementsByTagName(o)[0];a.async=1;a.src=g;m.parentNode.insertBefore(a,m)
      })(window,document,'script','https://www.google-analytics.com/analytics.js','ga');
      ga('create', process.env.GA_TRACKING_CODE, 'auto');
      ga('send', 'pageview');
      /* eslint-enable */
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
  color: #2c3e50;
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
  border-bottom: 1px solid #e5e5e5;
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
