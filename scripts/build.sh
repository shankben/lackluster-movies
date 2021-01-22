#!/bin/bash

set -e

CWD=$(pwd -P)

mkdir -p dist/infra/src
mkdir -p dist/core

rsync -azr --delete src/infra/src/ dist/infra/src/
rsync -azr --delete src/core/package.json dist/core/

cd dist/infra/src/lambda/layers/base/nodejs && \
npm i --no-package-lock $(npm pack $CWD/dist/core | tail -1) && \
rm *.tgz

cd $CWD && npx tsc -b
