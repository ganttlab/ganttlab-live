<template>
  <div id="app">
    <transition name="fade">
      <div v-if="failed == true || userEmpty" class="login">
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
                <input tabindex="1" v-model="url" v-on:keyup.enter="init" autofocus>
              </p>
              <p class="helper">Your GitLab instance URL</p>
              <p class="form-input">
                <input tabindex="2" v-model="token" v-on:keyup.enter="init">
              </p>
              <p class="helper">Use your <a v-bind:href="privateTokenLink" target="_blank" title="/profile/account">Private Token</a>, or a <a v-bind:href="personalTokenLink" target="_blank" title="/profile/personal_access_tokens">Personal Access Token</a></p>

              <p v-if="hasLocalStorage" class="form-input remember"><input tabindex="3" type="checkbox" v-model="rememberMe"> <span>Remember me <i class="fa fa-question-circle-o" aria-hidden="true" title="Don't do that on a public computer!"></i></span> <button tabindex="4" v-on:click="init">Sign-in &nbsp;&gt;</button></p>
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
  font-family: 'Anaheim', sans-serif;
  -webkit-font-smoothing: antialiased;
  color: #151515;
  margin: 0;
  padding: 0;
}
h1,
h2 {
  font-family: 'Quattrocento Sans', sans-serif;
}
a {
  color: #151515;
  text-decoration: none;
  transition: color 0.2s;
}
a:hover {
  color: rgba(6, 179, 230, 1);
}
.login {
  width: 60%;
  font-size: 20px;
  position: absolute;
  top: 48.54%;
  left: 50%;
  transform: translateX(-50%) translateY(-50%);
  display: table;
  width: 60%;
}
.login .row{
  display:table-row;
  width:auto;
  clear:both;
}
.login .col{
  float: left;
  display: table-column;
  width: 200px;
}
.login .welcome {
  width: 60%;
  display: inline-block;
  font-size: 16px;
}
.login .welcome .pad {
  padding: 0px 40px;
}
.login .form {
  display: inline-block;
  width: 40%;
}
.login h1 {
  font-size: 2.375rem;
  text-align: left;
  border-bottom: 1px solid rgba(21, 21, 21, 0.05);
  padding: 0 0 0.5rem 1rem;
  margin: 0 0 2rem;
}
.login h2 {
  font-size: 1.375rem;
  margin-bottom: 30px;
}
.login .error,
.login .downloading {
  text-align: center;
  margin-top: 30px;
  font-size: 1rem;
}
.login .error {
  color: #a94442;
}
.login input,
.login input[type="checkbox"] {
  font-family: 'Anaheim', sans-serif;
  border: 1px solid rgba(21, 21, 21, 0.1);
  border-radius: 2px;
  transition: all ease-in-out 0.15s;
}
.login .form-input.first {
  margin-top: 1.7rem;
}
.login .form-input input:focus,
.login input[type="checkbox"]:focus,
.login button:focus {
  outline: none;
  border-color: #00b3e6;
  box-shadow: 0 0 5px #00b3e6;
}
.login .form-input input {
  display: inline-block;
  width: 90%;
  height: 34px;
  padding: 6px 12px;
  font-size: 14px;
  line-height: 1.42857143;
  color: #555;
  background-color: #fff;
  background-image: none;
  height: 20px;
}
.login .form-input.remember {
  text-align: left;
  margin-top: 2rem;
}
.login .form-input.remember span {
  font-size: 1rem;
}
.login .form-input.remember input {
  height: 13px;
}
.login .form-input.remember span,
.login .form-input.remember input {
  width: auto;
}
.login .form-input.remember button {
  background-color: rgba(6, 179, 230, 1);
  color: #fff;
  font-family: 'Quattrocento Sans', sans-serif;
  border: 1px solid transparent;
  border-radius: 0;
  display: inline-block;
  font-size: 0.8em;
  padding: 4px 1em;
  text-align: center;
  cursor: pointer;
  margin-right: 10px;
  float: right;
  transition: all ease-in-out 0.15s;
}
.login .form-input.remember button:hover {
  background-color: rgba(6, 179, 230, 0.8);
}
.helper {
  text-align: left;
  font-size: 0.62em;
  margin: -17px 0 0 5px;
}
.helper a {
  border-bottom: 1px dotted rgba(21, 21, 21, 0.2);
}
.helper a:hover {
  text-decoration: none;
}
.more {
  border-top: 1px solid rgba(21, 21, 21, 0.05);
  margin-top: 2rem;
}
.col.copy,
.col.social {
  font-family: 'Quattrocento Sans', sans-serif;
  font-size: 0.75em;
}
.col.copy .pad,
.col.social .pad {
  padding: 0.5rem 0 0 1rem;
}
.col.copy {
  font-weight: 700;
  width: 60%;
  display: inline-block;
}
.col.copy i {
  margin-left: 5px;
}
.copyright {
  font-family: 'Anaheim', sans-serif;
  font-weight: normal;
  font-size: 0.75rem;
  margin-top: -12px;
}
.col.social {
  font-family: 'Anaheim', sans-serif;
  font-size: 0.875rem;
  text-align: right;
  display: inline-block;
  width: 40%;
}
.col.social p.first {
  margin-top: 14px;
}
.col.social p {
  margin: 0;
  line-height: 21px;
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
#top .user {
  font-family: 'Quattrocento Sans', sans-serif;
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
