/**
 * Pure timeline projection helpers.
 *
 * Keeping these functions independent from React and the DOM makes the
 * conversation model easy to test and protects the UI from host snapshot
 * shape changes.
 */

export function clip(value, maxLength) {
  if (value == null) return ''
  const text = String(value).replace(/\s+/g, ' ').trim()
  if (text.length <= maxLength) return text
  return `${text.slice(0, Math.max(0, maxLength - 1))}…`
}

function blockText(block) {
  if (block == null) return ''
  if (typeof block === 'string') return block
  if (typeof block.text === 'string' && block.text) return block.text
  if (typeof block.content === 'string' && block.content) return block.content
  return ''
}

export function extractText(value, maxLength = 220) {
  if (value == null) return ''
  if (typeof value === 'string') return clip(value, maxLength)
  if (typeof value === 'number' || typeof value === 'boolean') return String(value)
  if (typeof value.text === 'string' && value.text) return clip(value.text, maxLength)
  if (typeof value.summary === 'string' && value.summary) return clip(value.summary, maxLength)
  if (typeof value.message === 'string' && value.message) return clip(value.message, maxLength)
  if (typeof value.preview === 'string' && value.preview) return clip(value.preview, maxLength)

  if (Array.isArray(value.blocks)) {
    const parts = []
    for (const block of value.blocks) {
      if (!block || typeof block !== 'object') continue
      if ((block.kind === 'text' || block.kind === 'reasoning') && block.text) {
        parts.push(block.text)
      } else if (block.kind === 'tool-call') {
        parts.push(`${block.name || 'tool'}${block.argsRaw ? ` ${block.argsRaw}` : ''}`)
      }
    }
    const text = parts.join(' ').trim()
    if (text) return clip(text, maxLength)
  }

  if (Array.isArray(value.content)) {
    const text = value.content.map(blockText).filter(Boolean).join(' ').trim()
    if (text) return clip(text, maxLength)
  }

  if (typeof value.name === 'string' && value.name) {
    return clip(`${value.name}${value.argsRaw ? ` ${value.argsRaw}` : ''}`, maxLength)
  }
  return ''
}

export function kindTitle(kind, data) {
  switch (kind) {
    case 'user': return 'User'
    case 'assistant-step': return 'Assistant'
    case 'tool-call': return data?.name || 'Tool'
    case 'context': return 'Context'
    case 'compaction':
    case 'manual-compaction': return 'Compaction'
    case 'command':
    case 'command-input': return data?.name ? `/${data.name}` : 'Command'
    case 'model-retry': return 'Retry'
    case 'steering': return 'Steering'
    case 'turn-error': return 'Error'
    case 'turn-max-tokens': return 'Max tokens'
    case 'workflow-run': return 'Workflow'
    case 'turn-tail': return 'Turn'
    case 'unknown': return 'Unknown'
    default: return kind || 'Node'
  }
}

export function kindRole(kind) {
  if (kind === 'user' || kind === 'command-input') return 'user'
  if (kind === 'assistant-step') return 'assistant'
  if (kind === 'tool-call') return 'tool'
  if (kind === 'turn-error' || kind === 'turn-max-tokens') return 'error'
  return 'other'
}

export function isMessageRole(role) {
  return role === 'user' || role === 'assistant'
}

export function locationOf(node) {
  const location = node?.location
  if (!location) return {}
  if (location.kind === 'turn' && location.turn) return { turn: location.turn.turn }
  if (location.kind === 'step' && location.turn) {
    return { turn: location.turn.turn, step: location.step?.step }
  }
  return {}
}

export function projectNavPoints(chat) {
  if (!chat || !Array.isArray(chat.order) || !chat.nodes) return []
  const points = []
  for (const key of chat.order) {
    const node = chat.nodes.get(key)
    if (!node || (node.visibility && node.visibility !== 'visible')) continue
    const location = locationOf(node)
    points.push({
      id: key,
      key,
      kind: node.kind,
      role: kindRole(node.kind),
      anchorSeq: typeof node.anchorSeq === 'number' ? node.anchorSeq : 0,
      turn: location.turn,
      step: location.step,
      title: kindTitle(node.kind, node.data),
      preview: extractText(node.data),
      flags: node.kind === 'turn-error' || node.kind === 'turn-max-tokens' ? ['error'] : [],
    })
  }
  return points
}

export function filterNavPoints(points, mode) {
  return mode === 'all' ? points : points.filter((point) => isMessageRole(point.role))
}

export function groupNavPoints(points) {
  const groups = []
  let current = null
  for (const point of points) {
    if (!current || current.turn !== point.turn) {
      current = { turn: point.turn, items: [] }
      groups.push(current)
    }
    current.items.push(point)
  }
  return groups
}
