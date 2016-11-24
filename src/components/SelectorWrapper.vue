<template>
  <div v-if="this.user">
    <div id="mainfilter">
      <input type="radio" id="inputListByMe" value="me" v-model="listBy" v-on:change="clearAndListByMe"><label for="inputListByMe">Created by me</label><input type="radio" id="inputListByProject" value="project" v-model="listBy" v-on:change="listByProject"><label for="inputListByProject">By project</label><input type="radio" id="inputListByGroup" value="group" v-model="listBy" v-on:change="listByGroup"><label for="inputListByGroup">By group/project</label>
      <span v-if="! downloading" v-on:click="refreshIssues" class="refresh"><i class="fa fa-refresh" aria-hidden="true"></i> Refresh</span>
    </div>

    <div v-if="this.listBy === 'group'" class="subfilter">
      <div class="multiselect-container">
        <multiselect
          :options="GitLab.groups"
          :value="group"
          :close-on-select="true"
          :show-labels="false"
          :loading="downloading"
          placeholder="Type to search a group"
          label="path"
          @search-change="searchGroups"
          @input="selectedGroup">
          <span slot=noResult>No group found with this name</span>
        </multiselect>
      </div>
      <span class="group-separator">/</span>
      <div class="multiselect-container">
        <multiselect
          :options="GitLab.groupProjects"
          :value="gProject"
          :close-on-select="true"
          :show-labels="false"
          :loading="downloading"
          placeholder="Search a project (defaults to all)"
          label="path_with_namespace"
          @search-change="searchGroupProjects"
          @input="selectedGroupProject">
          <span slot=noResult>No project on this group with this name</span>
        </multiselect>
      </div>
    </div>

    <div v-if="this.listBy === 'project'" class="subfilter">
      <div class="multiselect-container">
        <multiselect
          :options="GitLab.projects"
          :value="project"
          :close-on-select="true"
          :show-labels="false"
          :loading="downloading"
          placeholder="Type to search a project"
          label="path_with_namespace"
          @search-change="searchProjects"
          @input="listProjectIssues">
        </multiselect>
      </div>
    </div>

    <div class="standardpadding">
      <p v-if="downloading" class="downloading"><i class="fa fa-circle-o-notch fa-spin" aria-hidden="true"></i></p>

      <gantt v-bind:issues="GitLab.issues" v-if="GitLab.issues != null"></gantt>

      <div v-if="! downloading && (this.paginationLinks.prev || this.paginationLinks.next)" class="pagination">
        <button v-if="this.paginationLinks.prev" v-on:click="paginationPrev">&lt; Prev</button>
        <span>Page {{ this.GitLab._paginationPage }}</span>
        <button v-if="this.paginationLinks.next" v-on:click="paginationNext">Next &gt;</button>
        <div class="perpage">
          Showing
          <select v-model="GitLab._paginationPerPage" v-on:change="paginationRefresh">
            <option v-for="value in [10,20,50,75,100]" v-bind:value="value">{{ value }}</option>
          </select>
          issues per page
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import Multiselect from 'vue-multiselect'
import debounce from 'lodash.debounce'
import Gantt from './Gantt'

export default {
  name: 'selectorWrapper',
  props: [
    'user',
    'downloading'
  ],
  data () {
    return {
      // main GitLab object, will be filled with data
      GitLab: {
        // list of groups user has access to
        groups: null,
        // list of projects in the group selected by the user
        groupProjects: null,
        // list of projects
        projects: null,
        // list of issues, sent to <gant> as a `props`
        issues: null,

        _links: [],
        _paginating: null,
        _paginationPerPage: 100,
        _paginationPage: 1
      },

      // main filter for listing issues:
      // - by 'group' (group/project),
      // - by 'project' (single project),
      // - or by 'me' (all issue connected user created)
      listBy: null,

      // FILTERING BY 'group'
      // selected group
      group: null,
      // selected project in this group
      gProject: null,

      // FILTERING BY 'project'
      // selected project
      project: null
    }
  },
  components: {
    Multiselect,
    Gantt
  },
  methods: {
    clearSelection: function (event) {
      // clearing the issues
      this.GitLab.issues = null
      // clearing the links header
      this.GitLab._links = []
      // back to the first pagination page
      this.GitLab._paginationPage = 1
      // we are not paginating anything
      this.GitLab._paginating = null
    },
    listByGroup: function (event, cb, query) {
      // adding window history url
      window.history.pushState(null, null, '/?l=group')

      this.clearSelection()

      // clearing the list of groups
      this.GitLab.groups = []
      this.group = null

      // clearing the list of group projects
      this.GitLab.groupProjects = []
      this.gProject = null

      // refreshing the list of groups
      this.refreshGroups(cb, query)
    },
    listByProject: function (event, cb, query) {
      // adding window history url
      window.history.pushState(null, null, '/?l=project')

      this.clearSelection()

      // clearing the list of projects
      this.GitLab.projects = []
      this.project = null

      // refreshing the list of projects
      this.refreshProjects(cb)
    },
    listByMe: function (event) {
      // adding window history url
      window.history.pushState(null, null, '/?l=me')

      // clearing the issues
      this.GitLab.issues = null

      // user wants issues for all projects created by himself
      this.GitLabAPI.get('/issues', {
        'page': this.GitLab._paginationPage,
        'per_page': this.GitLab._paginationPerPage,
        'state': 'opened'
      }, (response) => {
        this.GitLab._links = response.headers.get('Link')
        this.GitLab._paginating = 'listByMe'
        this.GitLab.issues = response.body
      })
    },
    clearAndListByMe: function (event) {
      this.clearSelection()
      this.listByMe()
    },
    selectedGroup: function (selectedGroup, cb) {
      if (selectedGroup != null) {
        this.group = selectedGroup
      }

      // adding window history url
      window.history.pushState(null, null, '/?l=group&g=' + encodeURI(this.group.path))

      // clearing the list of groups
      this.GitLab.groupProjects = []
      this.gProject = null

      // refresh the list of projects in this group
      this.refreshGroupProjects(cb)

      if (typeof cb === 'undefined' || cb == null) {
        // default to immediately listing all issues for all projects in this group
        this.listGroupIssues()
      }
    },
    selectedGroupProject: function (selectedGroupProject) {
      if (selectedGroupProject != null) {
        this.gProject = selectedGroupProject
      }

      if (this.gProject.path === 'all') {
        // listing all issues for all projects in this group
        this.listGroupIssues()
      } else {
        // listing all issues for the selected project in this group
        this.listGroupProjectIssues()
      }
    },
    searchGroups: debounce(function (query) {
      if (query.length !== 0) {
        this.refreshGroups(null, query)
      }
    }, 750),
    searchGroupProjects: debounce(function (query) {
      if (query.length !== 0) {
        this.refreshGroupProjects(null, query)
      }
    }, 750),
    searchProjects: debounce(function (query) {
      if (query.length !== 0) {
        this.refreshProjects(null, query)
      }
    }, 750),
    refreshGroups: function (cb, search) {
      // user wants the list of groups
      this.GitLabAPI.get('/groups', {
        'per_page': '10',
        'all_available': 1,
        'search': search || this.user.username
      }, (response) => {
        this.$set(this.GitLab, 'groups', response.body)
        if (typeof cb === 'function') {
          cb()
        }
      })
    },
    refreshGroupProjects: function (cb, search) {
      // user wants the list of projects in this.group
      this.GitLabAPI.get('/groups/' + this.group.id + '/projects', {
        'per_page': '10',
        'search': search
      }, (response) => {
        this.$set(this.GitLab, 'groupProjects', response.body)
        if (typeof cb === 'function') {
          cb()
        }
      })
    },
    refreshProjects: function (cb, search) {
      // user wants the list of projects
      this.GitLabAPI.get('/projects', {
        'per_page': '10',
        'search': search
      }, (response) => {
        this.$set(this.GitLab, 'projects', response.body)
        if (typeof cb === 'function') {
          cb()
        }
      })
    },
    listGroupIssues: function (event) {
      // adding window history url
      window.history.pushState(null, null, '/?l=group&g=' + encodeURI(this.group.path))

      // clearing the issues
      this.GitLab.issues = null

      // user wants issues for all projects in the selected group
      this.GitLabAPI.get('/groups/' + this.group.id + '/issues', {
        'page': this.GitLab._paginationPage,
        'per_page': this.GitLab._paginationPerPage,
        'state': 'opened'
      }, (response) => {
        this.GitLab._links = response.headers.get('Link')
        this.GitLab._paginating = 'listGroupIssues'
        this.GitLab.issues = response.body
      })
    },
    listGroupProjectIssues: function (event) {
      // adding window history url
      window.history.pushState(null, null, '/?l=group&g=' + encodeURI(this.group.path) + '&p=' + encodeURI(this.gProject.path_with_namespace))

      // clearing the issues
      this.GitLab.issues = null

      // user wants issues for a selected project
      this.GitLabAPI.get('/projects/' + this.gProject.id + '/issues', {
        'page': this.GitLab._paginationPage,
        'per_page': this.GitLab._paginationPerPage,
        'state': 'opened'
      }, (response) => {
        this.GitLab._links = response.headers.get('Link')
        this.GitLab._paginating = 'listGroupProjectIssues'
        this.GitLab.issues = response.body
      })
    },
    listProjectIssues: function (selectedProject) {
      if (selectedProject != null) {
        this.project = selectedProject
      }

      // adding window history url
      window.history.pushState(null, null, '/?l=project&p=' + encodeURI(this.project.path_with_namespace))

      // clearing the issues
      this.GitLab.issues = null

      // user wants issues for a selected project
      this.GitLabAPI.get('/projects/' + this.project.id + '/issues', {
        'page': this.GitLab._paginationPage,
        'per_page': this.GitLab._paginationPerPage,
        'state': 'opened'
      }, (response) => {
        this.GitLab._links = response.headers.get('Link')
        this.GitLab._paginating = 'listProjectIssues'
        this.GitLab.issues = response.body
      })
    },
    paginationNext: function (event) {
      if (typeof this.paginationLinks.next !== 'undefined') {
        this.GitLab._links = []
        this.GitLab._paginationPage++
        this[this.GitLab._paginating]()
      }
    },
    paginationPrev: function (event) {
      if (typeof this.paginationLinks.prev !== 'undefined') {
        this.GitLab._links = []
        this.GitLab._paginationPage--
        this[this.GitLab._paginating]()
      }
    },
    paginationRefresh: function (event) {
      this.GitLab._paginationPage = 1
      this.GitLab._links = []
      this[this.GitLab._paginating]()
    },
    refreshIssues: function (event) {
      if (this.listBy === 'me') {
        this.clearAndListByMe()
      } else if (this.listBy === 'project') {
        if (this.project == null) {
          // project undefined, refreshing projects
          this.listByProject()
        } else {
          // project defined, refreshing its issues!
          this.listProjectIssues()
        }
      } else if (this.listBy === 'group') {
        if (this.group == null && this.gProject == null) {
          // group and groupProject undefined, refreshing groups
          this.listByGroup()
        } else if (this.gProject == null) {
          // group undefined, refreshing group issues (for all projects)
          this.listGroupIssues()
        } else {
          // group and groupProject defined, refreshing issues!
          this.listGroupProjectIssues()
        }
      }
    },
    getParameterByName: function (name, url) {
      if (!url) {
        url = window.location.href
      }
      name = name.replace(/[[\]]/g, '\\$&')
      var regex = new RegExp('[?&]' + name + '(=([^&#]*)|&|#|$)')
      var results = regex.exec(url)
      if (!results) {
        return null
      }
      if (!results[2]) {
        return ''
      }
      return decodeURIComponent(results[2].replace(/\+/g, ' '))
    }
  },
  computed: {
    paginationLinks: function () {
      if (this.GitLab._links.length === 0) {
        return []
      }

      // Split parts by comma
      var parts = this.GitLab._links.split(',')
      var links = {}
      // Parse each part into a named link
      for (var i = 0; i < parts.length; i++) {
        var section = parts[i].split(';')
        if (section.length !== 2) {
          console.error('[GanttLab] GitLab API pagination link header seems to be inaccurate')
          return []
        }
        var url = section[0].replace(/<(.*)>/, '$1').trim()
        var name = section[1].replace(/rel="(.*)"/, '$1').trim()
        links[name] = url
      }
      return links
    }
  },
  mounted: function () {
    // reading user expected listBy method
    var expectedListBy = this.getParameterByName('l')
    // reading user expected project (if any)
    var expectedProject = this.getParameterByName('p')

    // authorized "by URL" expected listBy methods
    var authorizedListBy = ['project', 'group']

    if (authorizedListBy.indexOf(expectedListBy) > -1) {
      // we set the listBy method as expected by user
      this.listBy = expectedListBy

      if (expectedListBy === 'project') {
        // user wants to list by project

        // refreshing project list from GitLab
        this.listByProject(null, () => {
          for (var i = this.GitLab.projects.length - 1; i >= 0; i--) {
            if (this.GitLab.projects[i].path_with_namespace === expectedProject) {
              // expected project found: refreshing its issues!
              this.project = this.GitLab.projects[i]
              this.refreshIssues()
            }
          }
          // if expected project is not found, user is on /project view and has to choose
          // a project (the list has been refreshed by this.listByProject)
        }, expectedProject)
      } else if (expectedListBy === 'group') {
        // user wants to list by group and project

        // reading user expected group (if any)
        var expectedGroup = this.getParameterByName('g')

        // refreshing group list from GitLab
        this.listByGroup(null, () => {
          for (var i = this.GitLab.groups.length - 1; i >= 0; i--) {
            if (this.GitLab.groups[i].path === expectedGroup) {
              // expected group found
              this.group = this.GitLab.groups[i]
              if (expectedProject) {
                // user expected a project on this group

                // refreshing group projects
                this.selectedGroup(null, () => {
                  for (var i = this.GitLab.groupProjects.length - 1; i >= 0; i--) {
                    if (this.GitLab.groupProjects[i].path_with_namespace === expectedProject) {
                      // expected gProject found: refreshing its issues!
                      this.gProject = this.GitLab.groupProjects[i]
                      this.refreshIssues()
                    }
                  }
                  // if expected project is not found, user is on /group view with selected
                  // group and has to choose a project (the list has been refreshed by
                  // this.selectedGroup)
                })
              } else {
                // expected group found, user did not expected project: refreshing group issues!
                this.selectedGroup()
              }
            }
          }
          // if expected group is not found, user is on /group view and has to choose
          // a group (the list has been refreshed by this.listByGroup)
        }, expectedGroup)
      }
    } else {
      // user expected listBy is unauthorized, defaults to listing all issues created by user
      this.listBy = 'me'
      this.listByMe()
    }
  }
}
</script>

<!-- Add "scoped" attribute to limit CSS to this component only -->
<style>
.downloading {
  text-align: center;
  font-size: 2.5em;
}
#mainfilter {
  margin: 0;
  padding: 8px;
  background-color:#fafafa;
  border-bottom: 1px solid #e5e5e5;
  top: 0;
  left: 0;
  height: 26px;
  line-height: 26px;
  text-align: center;
}
#mainfilter input[type=radio] {
  display:none;
}
#mainfilter input[type=radio] + label {
  display:inline-block;
  margin:-2px;
  padding: 4px 12px;
  margin-bottom: 0;
  text-align: center;
  vertical-align: middle;
  cursor: pointer;
  border-bottom: 2px solid #fafafa;
  color: #777;
}
#mainfilter input[type=radio]:checked + label {
  border-bottom: 2px solid #00b3e6;
  color: #2c3e50;
}
.refresh {
  float: right;
  position: absolute;
  right: 10px;
  font-size: 0.8em;
  cursor: pointer;
}
.subfilter {
  margin: 0;
  padding: 8px;
  background-color:#f5f5f5;
  border-bottom: 1px solid #e5e5e5;
  top: 0;
  left: 0;
  height: 41px;
  line-height: 26px;
  text-align: center;
}
.multiselect-container {
  width: 300px;
  display: inline-block;
}
.multiselect__spinner:before,
.multiselect__spinner:after {
  border-color: #00b3e6 transparent transparent !important;
}
.multiselect__tag {
  background: #00b3e6 !important;
}
.multiselect__option--highlight {
  background: #00b3e6 !important;
}
.multiselect__option--highlight:after {
  background: #00b3e6 !important;
}
.group-separator {
  font-weight: bold;
  font-size: 1.5em;
}
.pagination {
  text-align: center;
}
.pagination span {
  margin: 0 20px;
}
.perpage {
  margin-top: 20px;
  text-align: center;
  font-size: 0.8em;
}
button {
  border: 1px solid #bbb;
  padding: 2px 4px 0;
  margin: 0;
  font: inherit;
  outline:none;
  line-height: 1.2;
  background: #f8f8f8;
  -webkit-border-radius: 4px;
  -moz-border-radius: 4px;
  border-radius: 4px;
  cursor: pointer;
}
</style>
