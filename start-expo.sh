#!/bin/bash
export PATH=$PATH:/root/.nvm/versions/node/v22.22.0/bin
export REACT_NATIVE_PACKAGER_HOSTNAME=165.232.188.213

cd /root/.openclawx/workspace/raaga/raaga-mobile

# Kill any existing metro on 8084
fuser -k 8084/tcp 2>/dev/null || true

exec npx expo start --lan --port 8084
