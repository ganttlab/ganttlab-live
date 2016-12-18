<template>
  <div v-if="userName" id="GitHub-Provider">
    <div class="filter">
      <input type="radio" id="inputListByMe" value="me" v-model="listBy" v-on:change="clearAndListByMe"><label for="inputListByMe">Created by me</label><input type="radio" id="inputListByProject" value="project" v-model="listBy" v-on:change="listByProject"><label for="inputListByProject">By repository</label><!-- <input type="radio" id="inputListByGroup" value="group" v-model="listBy" v-on:change="listByGroup"><label for="inputListByGroup">By owner/repository</label> -->
      <span v-if="! downloading" v-on:click="refreshIssues" class="refresh"><i class="fa fa-refresh" aria-hidden="true"></i> Refresh</span>
    </div>

    <div v-if="this.listBy === 'project'" class="subfilter">
      <div class="multiselect-container">
        <multiselect
          :options="GitHub.projects"
          :value="project"
          :close-on-select="true"
          :show-labels="false"
          :loading="downloading"
          placeholder="Type to search a repository"
          label="full_name"
          @search-change="searchProjects"
          @input="listProjectIssues">
        </multiselect>
      </div>
    </div>

    <div v-if="this.listBy === 'group'" class="subfilter">
      <div class="multiselect-container">
        <multiselect
          :options="GitHub.groups"
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
          :options="GitHub.groupProjects"
          :value="gProject"
          :close-on-select="true"
          :show-labels="false"
          :loading="downloading"
          placeholder="Search a project (defaults to all)"
          label="full_name"
          @search-change="searchGroupProjects"
          @input="selectedGroupProject">
          <span slot=noResult>No project on this group with this name</span>
        </multiselect>
      </div>
    </div>

    <transition name="fade">
      <div v-if="this.malformed.length" class="standardpadding">
        <p class="alert alert-danger">
          Some of your GitHub issues comes with malformed GanttStart or GanttDue dates:
          <ul>
            <li v-for="issue in this.malformed"><a v-bind:href="issue.web_url" target="_blank">{{ issue.title }}</a></li>
          </ul>
          Please use <a href="https://en.wikipedia.org/wiki/ISO_8601#Calendar_dates" target="_blank">ISO 8601 calendar dates</a> to plan your issues start and due dates: <em>GanttStart: YYYY-MM-DD</em> and/or <em>GanttDue: YYYY-MM-DD</em>.
        </p>
      </div>
    </transition>
  </div>
</template>

<script>
import SharedStates from '../../mixins/SharedStates'
import Multiselect from 'vue-multiselect'
import debounce from 'lodash.debounce'

export default {
  name: 'GitHub',
  mixins: [
    SharedStates
  ],
  components: {
    Multiselect
  },
  data () {
    return {
      ganttStartString: process.env.GANTT_START_STRING,
      ganttDueString: process.env.GANTT_DUE_STRING,
      // exact state in the app wide Vuex store during initialization
      emptyLinks: null,
      GitHubPaginationLinks: [],
      // main GitHub object, will be filled with data
      GitHub: {
        // list of groups user has access to
        groups: null,
        // list of projects in the group selected by the user
        groupProjects: null,
        // list of projects
        projects: null,
        // list of issues, sent to <gant> as a `props`
        issues: null,

        _paginating: null
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
      project: null,

      // issues coming with malformed GanttStart or GanttDue dates
      malformed: []
    }
  },
  computed: {
    tasks: function () {
      return this.GitHub.issues
    },
    ganttDataset: function () {
      if (this.GitHub.issues == null) {
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
          'link': task.html_url
        }

        // initializing task start and due date
        var startDate = null
        var dueDate = null

        // reading lines from this task body to search for ganttStartString and ganttDueString
        if (task.body != null) {
          var lines = task.body.split('\r\n')
          for (var j = 0; j < lines.length; j++) {
            // this task body line starts with the ganttStartString
            if (!lines[j].indexOf(this.ganttStartString)) {
              // this task start date for gantt view is set to the appropriate date
              startDate = new Date(lines[j].replace(this.ganttStartString, ''))
            }

            // this task body line starts with the ganttDueString
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
          // the task due date is unset
          dueDate = new Date(task.created_at)
          // the due date is calculated to the day after the task creation date
          dueDate.setDate(dueDate.getDate() + 1)
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

        // filtering invalid start or due date
        var invalid = 'NaN-NaN-NaN'
        if (fDueDate === invalid || fStartDate === invalid) {
          this.malformed.push(task)
          continue
        }

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
  watch: {
    ganttDataset: function (value) {
      // watch for calculated Gantt Dataset, and commit it in app wide Vuex store
      this.$store.commit('tasks', value)
    },
    paginationPage: function (value) {
      // watch for app wide Vuex store pagination.page, and refresh GitHub issues appropriately
      this.GitHubPaginationLinks = []
      // reset paginationLinks
      this.paginationLinks = JSON.parse(JSON.stringify(this.emptyLinks))
      this[this.GitHub._paginating]()
      window.scrollTo(0, 0)
    },
    paginationPerPage: function (value) {
      // watch for app wide Vuex store pagination.perPage
      if (this.paginationPage === 1) {
        // if already on page 1, watch.page won't be called: refresh GitHub issues appropriately
        this.GitHubPaginationLinks = []
        // reset paginationLinks
        this.paginationLinks = JSON.parse(JSON.stringify(this.emptyLinks))
        this[this.GitHub._paginating]()
        window.scrollTo(0, 0)
      } else {
        // if not on page one, just set page 1, and watch.page will refresh GitHub issues
        this.paginationPage = 1
      }
    },
    GitHubPaginationLinks: function (value) {
      var links = JSON.parse(JSON.stringify(this.emptyLinks))

      if (!value || value.length === 0) {
        // update app wide Vuex store
        this.paginationLinks = links
        return
      }

      // Split parts by comma
      var parts = value.split(',')
      // Parse each part into a named link
      for (var i = 0; i < parts.length; i++) {
        var section = parts[i].split(';')
        if (section.length !== 2) {
          console.error('[GanttLab] GitHub API pagination link header seems to be inaccurate')
          // update app wide Vuex store
          this.paginationLinks = links
          return
        }
        var url = section[0].replace(/<(.*)>/, '$1').trim()
        var name = section[1].replace(/rel="(.*)"/, '$1').trim()
        links[name] = url
      }

      // update app wide Vuex store
      this.paginationLinks = links
    }
  },
  methods: {
    clearSelection: function (event) {
      // clearing the issues
      this.GitHub.issues = null
      // clearing the links header
      this.GitHubPaginationLinks = []
      // back to the first pagination page
      this.paginationPage = 1
      // we are not paginating anything
      this.GitHub._paginating = null
    },
    listByGroup: function (event, cb, query) {
      // adding window history url
      window.history.pushState(null, null, '/?l=group')

      this.clearSelection()

      // clearing the list of groups
      this.GitHub.groups = []
      this.group = null

      // clearing the list of group projects
      this.GitHub.groupProjects = []
      this.gProject = null

      // refreshing the list of groups
      this.refreshGroups(cb, query)
    },
    listByProject: function (event, cb, query) {
      // adding window history url
      window.history.pushState(null, null, '/?l=project')

      this.clearSelection()

      // clearing the list of projects
      this.GitHub.projects = []
      this.project = null

      // refreshing the list of projects
      this.refreshProjects(cb)
    },
    listByMe: function (event) {
      // adding window history url
      window.history.pushState(null, null, '/?l=me')

      // clearing the issues
      this.GitHub.issues = null

      // user wants issues created by himself for any repository
      this.GitHubAPI.get('/search/issues', {
        'page': this.paginationPage,
        'per_page': this.paginationPerPage,
        'q': 'author:' + this.userName + ' is:open sort:created'
      }, (response) => {
        this.GitHubPaginationLinks = response.headers.get('Link')
        this.GitHub._paginating = 'listByMe'
        this.GitHub.issues = response.body.items
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
      this.GitHub.groupProjects = []
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
      this.GitHubAPI.get('/groups', {
        'per_page': '10',
        'all_available': 1,
        'search': search || this.userName
      }, (response) => {
        this.$set(this.GitHub, 'groups', response.body)
        if (typeof cb === 'function') {
          cb()
        }
      })
    },
    refreshGroupProjects: function (cb, search) {
      // user wants the list of projects in this.group
      this.GitHubAPI.get('/groups/' + this.group.id + '/projects', {
        'per_page': '100',
        'search': search
      }, (response) => {
        this.$set(this.GitHub, 'groupProjects', response.body)
        if (typeof cb === 'function') {
          cb()
        }
      })
    },
    refreshProjects: function (cb, search) {
      if (typeof search === 'undefined') {
        return
      }

      // user wants the list of repositories
      this.GitHubAPI.get('/search/repositories', {
        'per_page': '10',
        'q': search
      }, (response) => {
        this.$set(this.GitHub, 'projects', response.body.items)
        if (typeof cb === 'function') {
          cb()
        }
      })
    },
    listGroupIssues: function (event) {
      // adding window history url
      window.history.pushState(null, null, '/?l=group&g=' + encodeURI(this.group.path))

      // clearing the issues
      this.GitHub.issues = null

      // user wants issues for all projects in the selected group
      this.GitHubAPI.get('/groups/' + this.group.id + '/issues', {
        'page': this.paginationPage,
        'per_page': this.paginationPerPage,
        'state': 'opened'
      }, (response) => {
        this.GitHubPaginationLinks = response.headers.get('Link')
        this.GitHub._paginating = 'listGroupIssues'
        this.GitHub.issues = response.body
      })
    },
    listGroupProjectIssues: function (event) {
      // adding window history url
      window.history.pushState(null, null, '/?l=group&g=' + encodeURI(this.group.path) + '&p=' + encodeURI(this.gProject.full_name))

      // clearing the issues
      this.GitHub.issues = null

      // user wants issues for a selected project
      this.GitHubAPI.get('/projects/' + this.gProject.id + '/issues', {
        'page': this.paginationPage,
        'per_page': this.paginationPerPage,
        'state': 'opened'
      }, (response) => {
        this.GitHubPaginationLinks = response.headers.get('Link')
        this.GitHub._paginating = 'listGroupProjectIssues'
        this.GitHub.issues = response.body
      })
    },
    listProjectIssues: function (selectedProject) {
      if (selectedProject != null) {
        this.project = selectedProject
      }

      // adding window history url
      window.history.pushState(null, null, '/?l=project&p=' + encodeURI(this.project.full_name))

      // clearing the issues
      this.GitHub.issues = null

      // user wants issues for a selected project
      this.GitHubAPI.get('/search/issues', {
        'page': this.paginationPage,
        'per_page': this.paginationPerPage,
        'q': 'state:open type:issue repo:' + this.project.full_name
      }, (response) => {
        this.GitHubPaginationLinks = response.headers.get('Link')
        this.GitHub._paginating = 'listProjectIssues'
        this.GitHub.issues = response.body.items
      })
    },
    refreshIssues: function (event) {
      this.malformed = []
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
  mounted: function () {
    // populating the exact initial state
    this.emptyLinks = this.$store.state.pagination.links
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

        // refreshing project list from GitHub
        this.listByProject(null, () => {
          for (var i = this.GitHub.projects.length - 1; i >= 0; i--) {
            if (this.GitHub.projects[i].full_name === expectedProject) {
              // expected project found: refreshing its issues!
              this.project = this.GitHub.projects[i]
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

        // refreshing group list from GitHub
        this.listByGroup(null, () => {
          for (var i = this.GitHub.groups.length - 1; i >= 0; i--) {
            if (this.GitHub.groups[i].path === expectedGroup) {
              // expected group found
              this.group = this.GitHub.groups[i]
              if (expectedProject) {
                // user expected a project on this group

                // refreshing group projects
                this.selectedGroup(null, () => {
                  for (var i = this.GitHub.groupProjects.length - 1; i >= 0; i--) {
                    if (this.GitHub.groupProjects[i].full_name === expectedProject) {
                      // expected gProject found: refreshing its issues!
                      this.gProject = this.GitHub.groupProjects[i]
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