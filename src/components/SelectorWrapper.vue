<template>
  <div v-if="this.currentUser">
    <!-- Main filter selector -->
    <p>List issues
    <input type="radio" id="inputListByGroup" value="group" v-model="listBy" v-on:change="listByGroup"><label for="inputListByGroup"> by groups and projects</label>,
    or <input type="radio" id="inputListByProject" value="project" v-model="listBy" v-on:change="listByProject"><label for="inputListByProject"> by projects</label>,
    or <input type="radio" id="inputListByMe" value="me" v-model="listBy" v-on:change="listByMe"><label for="inputListByMe"> all issues created by me</label></p>
    
    <!-- User wants to list by groups -->
    <p v-if="this.listBy === 'group'">Groups you have access: 
      <select title="group" v-model="group" v-on:change="selectedGroup">
        <option v-for="aGroup in groups" v-bind:value="aGroup">
          {{ aGroup.path }}
        </option>
      </select>
      /
      <select title="group project" v-model="gProject" v-on:change="selectedGroupProject">
        <option v-for="aGroupProject in groupProjects" v-bind:value="aGroupProject">
          {{ aGroupProject.path }}
        </option>
      </select>
    </p>

    <!-- User wants to list by projects -->
    <p v-if="this.listBy === 'project'">
      Select a project: <select title="project" v-model="project" v-on:change="listProjectIssues">
        <option v-for="aProject in projects" v-bind:value="aProject">
          {{ aProject.path_with_namespace }}
        </option>
      </select>
    </p>

    <!-- Currently downloading? -->
    <p v-if="this.downloading === true"><i class="fa fa-circle-o-notch fa-spin" aria-hidden="true"></i> Downloading from GitLab...</p>

    <!-- The gantt component -->
    <gantt v-bind:issues="issues" v-if="issues != null"></gantt>
  </div>
</template>

<script>
import Gantt from './Gantt'

export default {
  name: 'selectorWrapper',
  props: [
    'GitLab',
    'currentUser'
  ],
  data () {
    return {
      // main filter for listing issues:
      // - by 'group' (group/project),
      // - by 'project' (single project),
      // - or by 'me' (all issue connected user created)
      listBy: null,

      defaultUnexistingPath: { path: 'loading...', path_with_namespace: 'loading...' },
      defaultAllPath: { path: 'all' },

      // FILTERING BY 'group'
      // list of groups
      groups: [ this.defaultUnexistingPath ],
      // selected group
      group: this.defaultUnexistingPath,
      // list of projects in this group
      groupProjects: [ this.defaultAllPath ],
      // selected project in this group
      gProject: this.defaultAllPath,

      // FILTERING BY 'project'
      // list of projects
      projects: [ this.defaultUnexistingPath ],
      // selected project
      project: this.defaultUnexistingPath,

      // currently downloading from GitLab
      dowloading: false,

      // issues are sent to <gant> as a `props`
      issues: null
    }
  },
  components: {
    Gantt
  },
  methods: {
    listByGroup: function (event) {
      // clearing the issues
      this.issues = null

      // clearing the list of groups to default value
      this.groups = [ this.defaultUnexistingPath ]
      // selecting the default one
      this.group = this.defaultUnexistingPath

      // clearing the list of group projects to default value
      this.groupProjects = [ this.defaultAllPath ]
      // selecting the default one
      this.gProject = this.defaultAllPath

      // refreshing the list of groups
      this.refreshGroups()
    },
    listByProject: function (event) {
      // clearing the issues
      this.issues = null

      // clearing the list of projects to default value
      this.projects = [ this.defaultUnexistingPath ]
      // selecting the default one
      this.project = this.defaultUnexistingPath

      // refreshing the list of projects
      this.refreshProjects()
    },
    listByMe: function (event) {
      // clearing the issues
      this.issues = null

      // we are downloading
      this.downloading = true
      // user wants issues for all projects created by himself
      this.$http.get(
        this.GitLab + '/issues',
        {
          headers: { 'PRIVATE-TOKEN': process.env.GITLAB_PRIVATE_TOKEN },
          params: {
            'per_page': '100',
            'state': 'opened'
          }
        }
      ).then((response) => {
        // we are no more downloading
        this.downloading = false
        // Assigning response body directly to this.issues
        this.issues = response.body
      }, (response) => {
        // error callback
      })
    },
    selectedGroup: function (event) {
      // clearing the list of groups to default value
      this.groupProjects = [ this.defaultAllPath ]
      // selecting the default one
      this.gProject = this.defaultAllPath

      // refresh the list of projects in this group
      this.refreshGroupProjects()
      // default to immediately listing all issues for all projects in this group
      this.listGroupIssues()
    },
    selectedGroupProject: function (event) {
      if (this.gProject.path === 'all') {
        // listing all issues for all projects in this group
        this.listGroupIssues()
      } else {
        // listing all issues for the selected project in this group
        this.listGroupProjectIssues()
      }
    },
    refreshGroups: function (event) {
      // we are downloading
      this.downloading = true
      // user wants the list of groups
      this.$http.get(
        this.GitLab + '/groups',
        {
          headers: { 'PRIVATE-TOKEN': process.env.GITLAB_PRIVATE_TOKEN },
          params: {
            'per_page': '100',
            'all_available': 1,
            'search': this.currentUser.username // TODO remove this while implementing an efficient select with search
          }
        }
      ).then((response) => {
        // we are no more downloading
        this.downloading = false
        // Assigning response body directly to this.groups
        this.groups = response.body
      }, (response) => {
        // error callback
      })
    },
    refreshGroupProjects: function (event) {
      // we are downloading
      this.downloading = true
      // user wants the list of projects in this.group
      this.$http.get(
        this.GitLab + '/groups/' + this.group.id + '/projects',
        {
          headers: { 'PRIVATE-TOKEN': process.env.GITLAB_PRIVATE_TOKEN },
          params: {
            'per_page': '100'
          }
        }
      ).then((response) => {
        // we are no more downloading
        this.downloading = false
        // Assigning response body directly to this.groupProjects
        this.groupProjects = response.body
        // Inserting first default unexisting "All" project
        this.groupProjects.unshift(this.defaultAllPath)
      }, (response) => {
        // error callback
      })
    },
    refreshProjects: function (event) {
      // we are downloading
      this.downloading = true
      // user wants the list of projects
      this.$http.get(
        this.GitLab + '/projects',
        {
          headers: { 'PRIVATE-TOKEN': process.env.GITLAB_PRIVATE_TOKEN },
          params: {
            'per_page': '100'
          }
        }
      ).then((response) => {
        // we are no more downloading
        this.downloading = false
        // Assigning response body directly to this.projects
        this.projects = response.body
      }, (response) => {
        // error callback
      })
    },
    listGroupIssues: function (event) {
      // clearing the issues
      this.issues = null

      // we are downloading
      this.downloading = true
      // user wants issues for all projects in the selected group
      this.$http.get(
        this.GitLab + '/groups/' + this.group.id + '/issues',
        {
          headers: { 'PRIVATE-TOKEN': process.env.GITLAB_PRIVATE_TOKEN },
          params: {
            'per_page': '100',
            'state': 'opened'
          }
        }
      ).then((response) => {
        // we are no more downloading
        this.downloading = false
        // Assigning response body directly to this.issues
        this.issues = response.body
      }, (response) => {
        // error callback
      })
    },
    listGroupProjectIssues: function (event) {
      // clearing the issues
      this.issues = null

      // we are downloading
      this.downloading = true
      // user wants issues for a selected project
      this.$http.get(
        this.GitLab + '/projects/' + this.gProject.id + '/issues',
        {
          headers: { 'PRIVATE-TOKEN': process.env.GITLAB_PRIVATE_TOKEN },
          params: {
            'per_page': '100',
            'state': 'opened'
          }
        }
      ).then((response) => {
        // we are no more downloading
        this.downloading = false
        this.issues = response.body
      }, (response) => {
        // error callback
      })
    },
    listProjectIssues: function (event) {
      // clearing the issues
      this.issues = null

      // we are downloading
      this.downloading = true
      // user wants issues for a selected project
      this.$http.get(
        this.GitLab + '/projects/' + this.project.id + '/issues',
        {
          headers: { 'PRIVATE-TOKEN': process.env.GITLAB_PRIVATE_TOKEN },
          params: {
            'per_page': '100',
            'state': 'opened'
          }
        }
      ).then((response) => {
        // we are no more downloading
        this.downloading = false
        this.issues = response.body
      }, (response) => {
        // error callback
      })
    }
  }
}
</script>

<!-- Add "scoped" attribute to limit CSS to this component only -->
<style scoped>
</style>
