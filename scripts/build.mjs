import { build } from 'esbuild'
import { mkdir, readFile, rm, writeFile } from 'node:fs/promises'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const temporaryBundle = resolve(root, '.tmp/client.bundle.cjs')
const clientOutput = resolve(root, 'lib/client.js')
const hostOutput = resolve(root, 'lib/index.js')

await mkdir(resolve(root, '.tmp'), { recursive: true })
await mkdir(resolve(root, 'lib'), { recursive: true })

await build({
  entryPoints: [resolve(root, 'src/client/index.js')],
  bundle: true,
  platform: 'browser',
  format: 'cjs',
  target: 'es2020',
  outfile: temporaryBundle,
  legalComments: 'none',
  external: [
    'react',
    '@deepseek-ai/*',
  ],
})

const body = await readFile(temporaryBundle, 'utf8')
const output = `window.__ModuleLoader__.load({
  id: "@deepseek-ai/dsh-client-ui-timeline-navigator",
  factory: (require) => {
    var module = { exports: {} };
    var exports = module.exports;
${body.split('\n').map((line) => `    ${line}`).join('\n')}
    return module.exports;
  }
});
`

await writeFile(clientOutput, output, 'utf8')
await writeFile(hostOutput, `/** Generated host entry. */\nexport function apply() {}\n`, 'utf8')
await rm(resolve(root, '.tmp'), { recursive: true, force: true })
console.log(`Built ${clientOutput}`)
