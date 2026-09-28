import assert from 'node:assert/strict'
import { execFileSync } from 'node:child_process'
import { readFileSync, statSync } from 'node:fs'
import { resolve } from 'node:path'

const compiler = resolve(import.meta.dirname, '..')
const app = resolve(process.argv[2] ?? resolve(compiler, '../examples/apps/counter-jsx'))
const build = resolve(process.argv[3] ?? resolve(compiler, '../pebble/packages/geastack-pebble/targets/pebble/build-pebble.sh'))
// Always measure the compiler under test, including in a separate Git checkout.
const env = { ...process.env, GEA_GEATSC_BIN: resolve(compiler, 'dist/cli.js') }
delete env.GEA_PEBBLE_UI
delete env.GEA_PEBBLE_TOOLCHAIN
delete env.GEA_PEBBLE_ALLOC_TRACE
execFileSync('bash', [build, app], { env, stdio: 'inherit' })
const output = resolve(app, 'dist/pebble')
const decision = JSON.parse(readFileSync(resolve(output, '.generated/counter-jsx/pebble-ui.json'), 'utf8'))
assert.equal(decision.mode, 'compiled')
const image = readFileSync(resolve(output, 'project/src/c/gea_program_image.inc'), 'utf8')
const bytes = Number(image.match(/^#define GEA_PEBBLE_PROGRAM_IMAGE_SIZE (\d+)u$/m)?.[1])
assert.ok(Number.isSafeInteger(bytes) && bytes > 0, 'missing program image size')
assert.ok(bytes <= 10_000, `counter program is ${bytes} bytes; its budget is 10,000 bytes`)
console.log(`Pebble counter: ${bytes} program bytes; ${statSync(resolve(output, 'counter-jsx.pbw')).size} bundle bytes`)
