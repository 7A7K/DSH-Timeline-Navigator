import test from 'node:test'
import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import { resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = resolve(fileURLToPath(new URL('..', import.meta.url)))
const packageJson = JSON.parse(await readFile(resolve(root, 'package.json'), 'utf8'))
const patch = await readFile(resolve(root, 'cordis.patch.yml'), 'utf8')
const clientSource = await readFile(resolve(root, 'src/client/index.js'), 'utf8')

test('declares the Harness web client and required injected host services', () => {
  assert.equal(packageJson.dsh?.client?.platform, 'web')
  for (const dependency of [
    '@deepseek-ai/dsh-client-runtime',
    '@deepseek-ai/dsh-client-locale',
    '@deepseek-ai/dsh-client-ui-slots',
    '@deepseek-ai/dsh-client-ui-settings-plugins',
  ]) {
    assert.ok(packageJson.dsh.client.inject.includes(dependency), `missing injected service: ${dependency}`)
  }
})

test('keeps the Cordis patch and UI slot integration wired', () => {
  assert.match(patch, /id: ui-timeline-navigator/)
  assert.match(patch, /@deepseek-ai\/dsh-client-ui-timeline-navigator/)
  assert.match(clientSource, /slots\.inject\('shell\.overlay'/)
  assert.match(clientSource, /slots\.inject\('settings\.plugin\.item'/)
})
