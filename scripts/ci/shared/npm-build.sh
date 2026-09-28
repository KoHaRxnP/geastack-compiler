#!/usr/bin/env bash
# Build a checked-out npm project. Usage: npm-build.sh <dir>
#
# Use the same locked npm dependency graph as a fresh clone.
set -euo pipefail

cd "$1"
npm ci --ignore-scripts
npm run build
