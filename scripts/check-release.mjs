import { readFile } from 'node:fs/promises'
import { resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = resolve(fileURLToPath(new URL('..', import.meta.url)))
const packageJson = JSON.parse(await readFile(resolve(root, 'package.json'), 'utf8'))
const packageLock = JSON.parse(await readFile(resolve(root, 'package-lock.json'), 'utf8'))
const changelog = await readFile(resolve(root, 'CHANGELOG.md'), 'utf8')

const version = packageJson.version
const lockVersion = packageLock.packages?.['']?.version ?? packageLock.version
const firstChangelogVersion = changelog.match(/^## \[(\d+\.\d+\.\d+(?:-[0-9A-Za-z.-]+)?)\]/m)?.[1]
const releaseRef = process.env.GITHUB_REF_NAME?.trim()

if (!/^\d+\.\d+\.\d+(?:-[0-9A-Za-z.-]+)?$/.test(version)) {
  throw new Error(`package.json has an invalid version: ${version}`)
}
if (lockVersion !== version) {
  throw new Error(`package-lock.json version ${lockVersion} does not match package.json ${version}`)
}
if (firstChangelogVersion !== version) {
  throw new Error(`CHANGELOG.md top entry ${firstChangelogVersion ?? '(missing)'} does not match package.json ${version}`)
}
if (releaseRef?.startsWith('v') && releaseRef.slice(1) !== version) {
  throw new Error(`Git tag ${releaseRef} does not match package.json ${version}`)
}

console.log(`Release metadata consistent: ${version}${releaseRef ? ` (${releaseRef})` : ''}`)
