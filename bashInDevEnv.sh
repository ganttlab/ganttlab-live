#!/usr/bin/env bash

docker run -it -p 8080:8080 --rm -w /webapp -v $(pwd):/webapp node:6 /bin/bash