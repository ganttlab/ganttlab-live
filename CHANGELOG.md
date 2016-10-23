# Changelog
All notable changes to this project are documented in this file.

The format is based on [Keep a Changelog](http://keepachangelog.com/) and this project adheres to [Semantic Versioning](http://semver.org/).

## [Unreleased]
### Added
- work in progress on [clorichel/gitlab-gantt issues](https://gitlab.com/clorichel/gitlab-gantt/issues?scope=all&state=opened&utf8=%E2%9C%93&label_name%5B%5D=Feature)...

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

[Unreleased]: https://gitlab.com/clorichel/gitlab-gantt/compare/v0.1.0...HEAD