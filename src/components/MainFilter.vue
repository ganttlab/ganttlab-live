<template>
  <div v-if="this.user">
    <div id="mainfilter">
      <input type="radio" id="inputListByMe" value="me" v-model="listBy" v-on:change="clearAndListByMe"><label for="inputListByMe">Created by me</label><input type="radio" id="inputListByProject" value="project" v-model="listBy" v-on:change="listByProject"><label for="inputListByProject">By project</label><input type="radio" id="inputListByGroup" value="group" v-model="listBy" v-on:change="listByGroup"><label for="inputListByGroup">By group/project</label>
      <span v-if="! downloading" v-on:click="refreshIssues" class="refresh"><i class="fa fa-refresh" aria-hidden="true"></i> Refresh</span>
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

    <div class="standardpadding">
      <p v-if="downloading" class="downloading"><i class="fa fa-circle-o-notch fa-spin" aria-hidden="true"></i></p>

      <gantt v-bind:tasks="ganttDataset" v-if="ganttDataset != null"></gantt>

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
import SharedStates from '../mixins/SharedStates'
import Multiselect from 'vue-multiselect'
import debounce from 'lodash.debounce'
import Gantt from './Gantt'

export default {
  name: 'mainFilter',
  mixins: [
    SharedStates
  ],
  props: [
    'user'
  ],
  data () {
    return {
      ganttStartString: process.env.GANTT_START_STRING,
      ganttDueString: process.env.GANTT_DUE_STRING,
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
        'per_page': '100',
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
    },
    pad: function (number) {
      var r = String(number)
      if (r.length === 1) {
        r = '0' + r
      }
      return r
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
    },
    tasks: function () {
      return this.GitLab.issues
    },
    ganttDataset: function () {
      if (this.GitLab.issues == null) {
        return null
      }

      // clearing the dataset to build it from tasks list
      var dataset = []

      // looping on tasks
      for (var i = this.tasks.length - 1; i >= 0; i--) {
        var task = this.tasks[i]

        // stripping task title to the first 42 characters
        var title = task.title
        if (title.length > 42) {
          title = title.substring(0, 42) + '...'
        }

        // creating the dataset
        var aDataset = {
          'title': title,
          'link': task.web_url
        }

        // initializing task start and due date
        var startDate = null
        var dueDate = null

        // reading lines from this task description to search for ganttStartString and ganttDueString
        if (task.description != null) {
          var lines = task.description.split('\r\n')
          for (var j = 0; j < lines.length; j++) {
            // this description line starts with the ganttStartString
            if (!lines[j].indexOf(this.ganttStartString)) {
              // this task start date for gantt view is set to the appropriate date
              startDate = new Date(lines[j].replace(this.ganttStartString, ''))
            }

            // this description line starts with the ganttDueString
            if (!lines[j].indexOf(this.ganttDueString)) {
              // this task due date for gantt view is set to the appropriate date
              dueDate = new Date(lines[j].replace(this.ganttDueString, ''))
            }
          }
        }

        // if start date is still null, we set it from task creation date
        if (startDate == null) {
          startDate = new Date(task.created_at)
        }

        // if due date is still null we set it to the task due date, or to the day after the task creation date
        if (dueDate == null) {
          dueDate = task.due_date
          if (dueDate == null) {
            // the task due date is unset
            dueDate = new Date(task.created_at)
            // the due date is calculated to the day after the task creation date
            dueDate.setDate(dueDate.getDate() + 1)
          } else {
            // the task due date is used
            dueDate = new Date(task.due_date)
          }
        }

        // determining if the task is late or not
        var today = new Date()
        var status = 1
        if (dueDate < today) {
          status = 0
        }

        // formatting start and due dates for visavail
        var fDueDate = dueDate.getUTCFullYear() + '-' + this.pad(dueDate.getUTCMonth() + 1) + '-' + this.pad(dueDate.getUTCDate())
        var fStartDate = startDate.getUTCFullYear() + '-' + this.pad(startDate.getUTCMonth() + 1) + '-' + this.pad(startDate.getUTCDate())
        aDataset.data = [
          [ fStartDate, status, fDueDate ]
        ]

        // adding the dataset built to the main dataset list
        dataset.push(aDataset)
      }

      if (dataset === []) {
        return null
      } else {
        return dataset
      }
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