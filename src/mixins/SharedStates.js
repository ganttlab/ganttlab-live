module.exports = {
  computed: {
    downloading: function () {
      if (typeof this.$store.state.GitLabAPI !== 'undefined') {
        return this.$store.state.GitLabAPI.downloading
      } else if (typeof this.$store.state.GitHubAPI !== 'undefined') {
        return this.$store.state.GitHubAPI.downloading
      } else {
        return false
      }
    },
    url: {
      get () {
        return this.$store.state.url
      },
      set (value) {
        this.$store.commit('url', value)
      }
    },
    token: {
      get () {
        return this.$store.state.token
      },
      set (value) {
        this.$store.commit('token', value)
      }
    },
    loginFailed: {
      get () {
        return this.$store.state.loginFailed
      },
      set (value) {
        this.$store.commit('loginFailed', value)
      }
    },
    userName: {
      get () {
        return this.$store.state.user.name
      },
      set (value) {
        var user = this.$store.state.user
        user.name = value
        this.$store.commit('user', user)
      }
    },
    userAvatarUrl: {
      get () {
        return this.$store.state.user.avatarUrl
      },
      set (value) {
        var user = this.$store.state.user
        user.avatarUrl = value
        this.$store.commit('user', user)
      }
    },
    tasks: function () {
      return this.$store.state.tasks
    },
    paginationPage: {
      get () {
        return this.$store.state.pagination.page
      },
      set (value) {
        var pagination = this.$store.state.pagination
        pagination.page = value
        this.$store.commit('pagination', pagination)
      }
    },
    paginationPerPage: {
      get () {
        return this.$store.state.pagination.perPage
      },
      set (value) {
        var pagination = this.$store.state.pagination
        pagination.perPage = value
        this.$store.commit('pagination', pagination)
      }
    },
    paginationLinks: {
      get () {
        return this.$store.state.pagination.links
      },
      set (value) {
        var pagination = this.$store.state.pagination
        pagination.links = value
        this.$store.commit('pagination', pagination)
      }
    }
  }
}
