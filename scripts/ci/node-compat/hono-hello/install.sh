#!/usr/bin/env bash
# What the build needs installed: node-compat's own dependencies, the
# unmodified hono package from npm, and the compiler under test.
#
# Install the exact compiler artifact from this checkout, as an npm consumer
# would. A registry compiler or a local symlink would test a different setup.
set -euo pipefail

node_compat=$(cd "${NODE_COMPAT_DIR:-node-compat}" && pwd)
compiler=$(cd "${COMPILER_DIR:-compiler}" && pwd)

cd "$node_compat"
npm ci --ignore-scripts
compiler_tarball=$(cd "$compiler" && npm pack --ignore-scripts --silent --pack-destination "$compiler/dist")
npm install --ignore-scripts --no-save --package-lock=false "$compiler/dist/$compiler_tarball"
node -e 'console.log("@geastack/compiler:", require.resolve("@geastack/compiler/package.json"))'

cd "$node_compat/apps/hono-hello"
npm ci --ignore-scripts
