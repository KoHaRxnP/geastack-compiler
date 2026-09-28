import { createRequire } from 'node:module'
import { dirname, join } from 'node:path'
import { pathToFileURL } from 'node:url'

// Use the shipping framework manifest and npm package layout, including nested
// dependencies. A compiler checkout does not require sibling repositories.
const require = createRequire(import.meta.url)
const packageRoot = (name) => dirname(require.resolve(`@geastack/${name}/package.json`))
const core = packageRoot('core')
const { includeFlags } = await import(pathToFileURL(join(core, 'gea_sources.mjs')).href)
export const nativeHostIncludes = includeFlags({
  GEA_CORE: core,
  GEA_HOST_DIR: packageRoot('host'),
  GEA_ENGINE_DIR: packageRoot('engine'),
  GEA_ELEMENTS_DIR: packageRoot('elements'),
  GEA_GEAOS_PACKAGE_DIR: packageRoot('geaos')
})
