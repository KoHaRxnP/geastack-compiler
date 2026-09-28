import { spawnSync } from 'node:child_process'
import { mkdirSync, readdirSync } from 'node:fs'
import { join, resolve } from 'node:path'

const root = resolve(import.meta.dirname, '..')
const output = join(root, 'measurements')
mkdirSync(join(output, 'cxx'), { recursive: true })
// Native tests must not put their output below the compiler's dist directory.
const env = { ...process.env, TMPDIR: output }
const failed = []
let completed = 0
const run = (args) => {
  console.log(`Running ${args.join(' ')}`)
  const stream = args[0].startsWith('scripts/run-')
  const result = spawnSync(process.execPath, args, {
    cwd: root,
    env,
    encoding: 'utf8',
    stdio: stream ? 'inherit' : 'pipe',
    maxBuffer: 64 * 1024 * 1024
  })
  const text = `${result.stdout ?? ''}${result.stderr ?? ''}`
  completed++
  if (result.status !== 0 || result.error) {
    failed.push(args.join(' '))
    console.error(text, result.error ?? `exit=${result.status}, signal=${result.signal}`)
  } else {
    const summary = text.split('\n').filter((line) => /^(ℹ (tests|pass|fail|skipped|todo)|\d+ programs:)/.test(line))
    console.log(summary.length ? summary.join('\n') : 'PASS')
  }
}
const unitFiles = (directory) =>
  readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const file = join(directory, entry.name)
    return entry.isDirectory() ? unitFiles(file) : entry.name.endsWith('.test.js') ? [file] : []
  })
// Each file gets a fresh process. Do not retain every TypeScript program or
// run native tests against the same output directory concurrently.
for (const file of unitFiles(join(root, 'dist')).sort()) run(['--test', file])
const helpers = new Set([
  'run.mjs',
  'contracts.mjs',
  'corpus-roots.mjs',
  'executable-suffix.mjs',
  'sanitizer.mjs',
  'pebble-counter-size.mjs'
])
for (const file of readdirSync(import.meta.dirname)
  .filter((file) => file.endsWith('.mjs') && !helpers.has(file))
  .sort()) {
  run([join(import.meta.dirname, file), ...(file === 'native-build-cache.mjs' ? ['--out-dir', join(output, 'cxx')] : [])])
}
run(['scripts/run-runtime-tests.mjs'])
run(['scripts/run-oracle-tests.mjs', '--workers', '1'])
console.log(`${completed} test commands: ${completed - failed.length} passed, ${failed.length} failed`)
for (const command of failed) console.error(`FAIL ${command}`)
process.exitCode = failed.length ? 1 : 0
