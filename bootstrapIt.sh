#!/usr/bin/env bash

echo -n "Please type in your GitLab instance URL (default: https://gitlab.com): "
read GITLAB_URL
if [ -z "${GITLAB_URL}" ]; then
    GITLAB_URL=https://gitlab.com
fi

echo -n "Now provide your GitLab token: "
read GITLAB_TOKEN
if [ -z "${GITLAB_TOKEN}" ]; then
	echo "You need to provide a token to connect to your GitLab instance API"
    exit 1
fi

# copying default configuration files without overwritting
cp -n config/dev.env.example.js config/dev.env.js
cp -n config/prod.env.example.js config/prod.env.js

# filling in ./config/dev.env.js with typed values
sed -i "s/^\(.*GITLAB_URL:\s\).*$/\1'\"${GITLAB_URL//\//\\/}\"',/" ./config/dev.env.js
sed -i "s/^\(.*GITLAB_TOKEN:\s\).*$/\1'\"${GITLAB_TOKEN//\//\\/}\"',/" ./config/dev.env.js

# installing node dependencies
npm install