#!/usr/bin/env bash

docker run -it -p 8080:8080 --rm -w /GanttLab-Live -v $(pwd):/GanttLab-Live node:6 /bin/bash