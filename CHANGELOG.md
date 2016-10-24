# Changelog
All notable changes to this project are documented in this file.

The format is based on [Keep a Changelog](http://keepachangelog.com/) and this project adheres to [Semantic Versioning](http://semver.org/).

## [Unreleased]
### Added
- Login screen includes a link to original repository for more readings
- An help button is now displayed next to the close button
- All issues created by user are automatically displayed at start without any click needed
- New top bar displaying user avatar and name on left, and GitLab instance URL with close button top right
- Trailing slash is now automatically removed from the GitLab instance URL
- Default token on production config is now empty, to provide better login screen experience
- An error message is displayed with full GitLab API URL on login screen if connection failed
- User is now able to close GitLab connection and choose another server on the login screen
- A login screen is now asking for GitLab URL and Private Token
- Application initial behavior has been refined
- Project has been renamed from "GitLab Gantt" to "GanttLab"
- Bold red for today label and vertical axis on the gantt graph [clorichel/ganttlab#3](https://gitlab.com/clorichel/ganttlab/issues/3)
- work in progress on [clorichel/ganttlab issues](https://gitlab.com/clorichel/ganttlab/issues?scope=all&state=opened&utf8=%E2%9C%93&label_name%5B%5D=Feature)...

## 0.1.0 - 2016-10-23
### Added
- This CHANGELOG file to hopefully serve as an evolving example of a standardized open source project CHANGELOG
- Groups are searched by current user name
- GitLab url and token, along with Moment.js locale are defined in configuration files
- A gantt chart derived from a D3.js based on Visavail.js work and Moment.js date manipulations
- The GanttStart and GanttDue string are configurable
- GanttDue string in issue description overrides the due date (for the edge cases it could be needed)
- GanttStart string in issue description overrides the creation date as the gantt start date
- Gantt start and due date are automatically calculated with issue creation date and due date
- Implemented bash scripts for a deadly simple "run it now!" steps
- Using vue-resource to get data in right from GitLab API
- Config files for dev and prod environments has been removed, gitignored, and replaced by example files
- A specific data URI is used to display an empty favicon
- README includes a preview, and describes main topics to get started
- Initial vue-cli scaffolding with webpack plugin

[Unreleased]: https://gitlab.com/clorichel/ganttlab/compare/v0.1.0...master