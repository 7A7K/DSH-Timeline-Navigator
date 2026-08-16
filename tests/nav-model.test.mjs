import test from 'node:test'
import assert from 'node:assert/strict'

import {
  extractText,
  filterNavPoints,
  groupNavPoints,
  kindRole,
  kindTitle,
  locationOf,
  projectNavPoints,
} from '../src/client/model.js'

function makeChat(order, nodeMap) {
  return { order, nodes: { get: (key) => nodeMap[key] } }
}

test('maps node kinds to stable roles and titles', () => {
  assert.equal(kindRole('user'), 'user')
  assert.equal(kindRole('command-input'), 'user')
  assert.equal(kindRole('assistant-step'), 'assistant')
  assert.equal(kindRole('tool-call'), 'tool')
  assert.equal(kindRole('turn-error'), 'error')
  assert.equal(kindTitle('tool-call', { name: 'bash' }), 'bash')
  assert.equal(kindTitle('turn-error', {}), 'Error')
})

test('extracts text from strings, blocks, tools, and truncates safely', () => {
  assert.equal(extractText({ content: [{ type: 'text', text: 'hello' }] }), 'hello')
  assert.equal(extractText({ blocks: [{ kind: 'text', text: 'hi' }, { kind: 'reasoning', text: 'think' }] }), 'hi think')
  assert.equal(extractText({ blocks: [{ kind: 'tool-call', name: 'bash', argsRaw: 'pwd' }] }), 'bash pwd')
  assert.equal(extractText('a'.repeat(100), 20).length, 20)
  assert.match(extractText('a'.repeat(100), 20), /…$/)
})

test('projects ordered visible nodes and skips missing/hidden nodes', () => {
  const chat = makeChat(['a', 'b', 'hidden', 'missing'], {
    a: { kind: 'user', anchorSeq: 1, visibility: 'visible', location: { kind: 'turn', turn: { turn: 1 } }, data: { text: 'hi' } },
    b: { kind: 'assistant-step', anchorSeq: 2, visibility: 'visible', location: { kind: 'step', turn: { turn: 1 }, step: { step: 1 } }, data: { text: 'yo' } },
    hidden: { kind: 'context', visibility: 'hidden', data: {} },
  })
  const points = projectNavPoints(chat)
  assert.equal(points.length, 2)
  assert.equal(points[0].key, 'a')
  assert.equal(points[1].step, 1)
})

test('handles malformed or empty snapshots defensively', () => {
  assert.deepEqual(projectNavPoints(null), [])
  assert.deepEqual(projectNavPoints({}), [])
  assert.deepEqual(locationOf({ location: { kind: 'session' } }), {})
})

test('filters message mode and query text without mutating the source', () => {
  const points = [
    { key: 'u', role: 'user', title: 'Deploy app', preview: 'production' },
    { key: 'a', role: 'assistant', title: 'Assistant', preview: 'done' },
    { key: 't', role: 'tool', title: 'bash', preview: 'npm test' },
  ]
  assert.deepEqual(filterNavPoints(points, 'messages', ''), points.slice(0, 2))
  assert.deepEqual(filterNavPoints(points, 'all', 'npm'), [points[2]])
  assert.equal(points.length, 3)
})

test('groups points by turn while preserving order', () => {
  const groups = groupNavPoints([
    { key: 'a', turn: 1 },
    { key: 'b', turn: 1 },
    { key: 'c', turn: 2 },
    { key: 'd' },
  ])
  assert.deepEqual(groups.map((group) => [group.turn, group.items.length]), [[1, 2], [2, 1], [undefined, 1]])
})

