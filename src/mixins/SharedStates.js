module.exports = {
  computed: {
    downloading: function () {
      if (typeof this.$store.state.GitLabAPI !== 'undefined') {
        return this.$store.state.GitLabAPI.downloading
      } else {
        return false
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
