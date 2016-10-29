var merge = require('webpack-merge')
var prodEnv = require('./prod.env')

module.exports = merge(prodEnv, {
  NODE_ENV: '"development"',

  // Place your GitLab instance URL here
  GITLAB_URL: '"https://gitlab.com"',
  // Your GitLab user Private Token or Personal Access Token
  GITLAB_TOKEN: '"your GitLab user token"',
  
  // Moment.js locale configuration
  MOMENTJS_LOCALE: '"en"',
  
  // You are free to configure any string for gantt start/due dates,
  // which are read in your issues descriptions
  GANTT_START_STRING: '"GanttStart: "',
  GANTT_DUE_STRING: '"GanttDue: "',
})
