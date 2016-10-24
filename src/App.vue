<template>
  <div id="app">
    <div class="status">
      <transition name="fade">
        <div v-if="user == false || user == -1">
          <p v-if="user == false" class="error">Unable to connect to {{ GitLab.url }}</p>
          <p v-if="user == -1"><strong><i class="fa fa-lock"></i> Please type in your GitLab details</strong></p>
          <p class="input"><span>GitLab instance URL</span><input v-model="url" v-on:keyup.enter="init"></p>
          <p class="input"><span>Your Private Token</span><input v-model="token" v-on:keyup.enter="init"></p>
          <p class="more"><a href="https://gitlab.com/clorichel/ganttlab" target="_blank">Read more about GanttLab<i class="fa fa-external-link"></i></a></p>
        </div>
      </transition>
    </div>
    <transition name="fade">
      <div v-if="Object.keys(user).length">
        <div id="top" class="standardpadding">
          <div v-if="Object.keys(user).length">
            <span class="user"><img v-bind:src="user.avatar_url"> {{ user.name }}</span>
            <span class="server"><a v-bind:href="url" target="_blank">{{ GitLab.url }}</a> <a href="https://gitlab.com/clorichel/ganttlab#how-it-works" target="_blank"><i class="fa fa-question-circle" aria-hidden="true" title="Help"></i></a> <i class="fa fa-times close" aria-hidden="true" v-on:click="reset" title="Close"></i></span>
          </div>
        </div>
        <selectorWrapper class="standardpadding" v-bind:user="user" v-bind:GitLab="GitLab"></selectorWrapper>
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
      token: process.env.GITLAB_PRIVATE_TOKEN,
      GitLab: {},
      user: -1
    }
  },
  components: {
    SelectorWrapper
  },
  methods: {
    getGitLabUser: function (event) {
      this.$http.get(
        this.GitLab.url + '/user',
        {
          headers: { 'PRIVATE-TOKEN': this.GitLab.token }
        }
      ).then((response) => {
        // Assigning response body directly to this.groups
        this.user = response.body
      }, (response) => {
        this.user = false
      })
    },
    init: function (event) {
      this.user = -1
      this.GitLab.url = this.url.replace(/\/$/, '') + '/api/v3'
      this.GitLab.token = this.token
      this.getGitLabUser()
    },
    reset: function (event) {
      this.user = -1
      this.token = ''
    }
  },
  mounted: function () {
    if (this.url && this.token) {
      this.init()
    }
    if (process.env.NODE_ENV === 'production') {
      /* eslint-disable */
      (function(i,s,o,g,r,a,m){i['GoogleAnalyticsObject']=r;i[r]=i[r]||function(){
      (i[r].q=i[r].q||[]).push(arguments)},i[r].l=1*new Date();a=s.createElement(o),
      m=s.getElementsByTagName(o)[0];a.async=1;a.src=g;m.parentNode.insertBefore(a,m)
      })(window,document,'script','https://www.google-analytics.com/analytics.js','ga');
      ga('create', 'UA-78984168-3', 'auto');
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
  font-size: 18px;
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translateX(-50%) translateY(-50%);
}
.status p {
  text-align: center;
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
.more {
  font-size: 0.75em;
}
.more i {
  margin-left: 5px;
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
