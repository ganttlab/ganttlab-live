<template>
  <div v-if="this.user">
    <div id="mainfilter">
      <input type="radio" id="inputListByMe" value="me" v-model="listBy" v-on:change="clearAndListByMe"><label for="inputListByMe">Created by me</label><input type="radio" id="inputListByProject" value="project" v-model="listBy" v-on:change="listByProject"><label for="inputListByProject">By project</label><input type="radio" id="inputListByGroup" value="group" v-model="listBy" v-on:change="listByGroup"><label for="inputListByGroup">By group/project</label>
      <span v-if="! downloading" v-on:click="refreshIssues" class="refresh"><i class="fa fa-refresh" aria-hidden="true"></i> Refresh</span>
    </div>

    <div v-if="this.listBy === 'group'" class="subfilter">
      <div class="custom-select">
        <select title="group" v-model="group" v-on:change="selectedGroup">
          <option v-for="aGroup in GitLab.groups" v-bind:value="aGroup">
            {{ aGroup.path }}
          </option>
        </select>
      </div>
      /
      <div class="custom-select">
        <select title="group project" v-model="gProject" v-on:change="selectedGroupProject">
          <option v-for="aGroupProject in GitLab.groupProjects" v-bind:value="aGroupProject">
            {{ aGroupProject.path }}
          </option>
        </select>
      </div>
    </div>

    <div v-if="this.listBy === 'project'" class="subfilter">
      <div class="custom-select">
        <select title="project" v-model="project" v-on:change="listProjectIssues">
          <option v-for="aProject in GitLab.projects" v-bind:value="aProject">
            {{ aProject.path_with_namespace }}
          </option>
        </select>
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
          <div class="custom-select">
            <select v-model="GitLab._paginationPerPage" v-on:change="paginationRefresh">
              <option v-for="value in [10,20,50,75,100]" v-bind:value="value">{{ value }}</option>
            </select>
          </div>
          issues per page
        </div>
      </div>
    </div>
  </div>
</template>

<script>
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

      defaultUnexistingPath: { path: 'loading...', path_with_namespace: 'loading...' },
      defaultAllPath: { path: 'all' },

      // FILTERING BY 'group'
      // selected group
      group: this.defaultUnexistingPath,
      // selected project in this group
      gProject: this.defaultAllPath,

      // FILTERING BY 'project'
      // selected project
      project: this.defaultUnexistingPath
    }
  },
  components: {
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
    listByGroup: function (event, cb) {
      // adding window history url
      window.history.pushState(null, null, 'group')

      this.clearSelection()

      // clearing the list of groups to default value
      this.GitLab.groups = [ this.defaultUnexistingPath ]
      // selecting the default one
      this.group = this.defaultUnexistingPath

      // clearing the list of group projects to default value
      this.GitLab.groupProjects = [ this.defaultAllPath ]
      // selecting the default one
      this.gProject = this.defaultAllPath

      // refreshing the list of groups
      this.refreshGroups(cb)
    },
    listByProject: function (event, cb) {
      // adding window history url
      window.history.pushState(null, null, 'project')

      this.clearSelection()

      // clearing the list of projects to default value
      this.GitLab.projects = [ this.defaultUnexistingPath ]
      // selecting the default one
      this.project = this.defaultUnexistingPath

      // refreshing the list of projects
      this.refreshProjects(cb)
    },
    listByMe: function (event) {
      // adding window history url
      window.history.pushState(null, null, 'me')

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
    selectedGroup: function (event, cb) {
      // adding window history url
      window.history.pushState(null, null, 'group?g=' + encodeURI(this.group.path))

      // clearing the list of groups to default value
      this.GitLab.groupProjects = [ this.defaultAllPath ]
      // selecting the default one
      this.gProject = this.defaultAllPath

      // refresh the list of projects in this group
      this.refreshGroupProjects(cb)

      if (typeof cb === 'undefined') {
        // default to immediately listing all issues for all projects in this group
        this.listGroupIssues()
      }
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
    refreshGroups: function (cb) {
      // user wants the list of groups
      this.GitLabAPI.get('/groups', {
        'per_page': '100',
        'all_available': 1,
        'search': this.user.username // TODO remove this while implementing an efficient select with search
      }, (response) => {
        this.$set(this.GitLab, 'groups', response.body)
        if (typeof cb === 'function') {
          cb()
        }
      })
    },
    refreshGroupProjects: function (cb) {
      // user wants the list of projects in this.group
      this.GitLabAPI.get('/groups/' + this.group.id + '/projects', {
        'per_page': '100'
      }, (response) => {
        this.$set(this.GitLab, 'groupProjects', response.body)
        if (typeof cb === 'function') {
          cb()
        }
      })
    },
    refreshProjects: function (cb) {
      // user wants the list of projects
      this.GitLabAPI.get('/projects', {
        'per_page': '100'
      }, (response) => {
        this.$set(this.GitLab, 'projects', response.body)
        if (typeof cb === 'function') {
          cb()
        }
      })
    },
    listGroupIssues: function (event) {
      // adding window history url
      window.history.pushState(null, null, 'group?g=' + encodeURI(this.group.path))

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
      window.history.pushState(null, null, 'group?g=' + encodeURI(this.group.path) + '&p=' + encodeURI(this.gProject.path_with_namespace))

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
    listProjectIssues: function (event) {
      // adding window history url
      window.history.pushState(null, null, 'project?p=' + encodeURI(this.project.path_with_namespace))

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
        if (this.project === this.defaultUnexistingPath) {
          // project defined, refreshing projects
          this.listByProject()
        } else {
          // project defined, refreshing its issues!
          this.listProjectIssues()
        }
      } else if (this.listBy === 'group') {
        if (this.group === this.defaultUnexistingPath && this.gProject === this.defaultAllPath) {
          // group and groupProject undefined, refreshing groups
          this.listByGroup()
        } else if (this.gProject === this.defaultAllPath) {
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
    // parsing window location href (full URL)
    var parser = document.createElement('a')
    parser.href = window.location.href

    // authorized "by URL" expected listBy methods
    var authorizedListBy = ['project', 'group']

    // reading user expected listBy method
    var expectedListBy = parser.pathname.slice(1)
    // reading user expected project (if any)
    var expectedProject = this.getParameterByName('p')

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
        })
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
        })
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
<style scoped>
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
  border-bottom: 2px solid #2199e8;
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
  height: 26px;
  line-height: 26px;
  text-align: center;
}
.custom-select {
  position: relative;
  display: inline-block;
}
.custom-select select {
  display: inline-block;
  border: 1px solid #bbb;
  padding: 3px 1px 2px 3px;
  margin: 0;
  font: inherit;
  outline:none;
  line-height: 1.2;
  background: #f8f8f8;
  -webkit-appearance:none;
  -webkit-border-radius: 4px;
  -moz-border-radius: 4px;
  border-radius: 4px;
}
@media screen and (-webkit-min-device-pixel-ratio:0) { 
  .custom-select select {
    padding-right:30px;    
  }
}
.custom-select:after {
  content: "▼";
  position: absolute;
  top: 0;
  right: 0;
  bottom: 0;
  font-size: 90%;
  line-height: 28px;
  padding: 0 7px;
  background: #f8f8f8;
  color: #777;
  pointer-events:none;
  border: 1px solid #bbb;
  -webkit-border-radius: 0 4px 4px 0;
  -moz-border-radius: 0 4px 4px 0;
  border-radius: 0 4px 4px 0;
}
.no-pointer-events .custom-select:after {
  content: none;
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
.perpage .custom-select:after {
  line-height: 22px;
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
