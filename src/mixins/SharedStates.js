module.exports = {
  computed: {
    downloading: function () {
      if (typeof this.$store.state.GitLabAPI !== 'undefined') {
        return this.$store.state.GitLabAPI.downloading
      } else {
        return false
      }
    }
  }
}
