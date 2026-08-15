import { visit } from 'unist-util-visit'
import { toString } from 'mdast-util-to-string'
import type { Heading, Root } from 'mdast'

const DIACRITIC_MARK = /\p{M}/gu

export function slugify(text: string): string {
  return text
    .normalize('NFD')
    .replace(DIACRITIC_MARK, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

export function getHeadingId(node: Heading): string | undefined {
  const id = node.data?.hProperties?.['id']
  return typeof id === 'string' ? id : undefined
}

export function getHeadingClasses(node: Heading): string[] {
  const className = node.data?.hProperties?.['className']
  return Array.isArray(className)
    ? className.filter((value): value is string => typeof value === 'string')
    : []
}

const HEADING_ATTR_PATTERN = /\s*\{([^}]*)\}\s*$/

interface HeadingAttrs {
  id?: string
  classes: string[]
}

function extractHeadingAttrs(node: Heading): HeadingAttrs {
  const lastChild = node.children[node.children.length - 1]
  if (!lastChild || lastChild.type !== 'text') return { classes: [] }

  const match = HEADING_ATTR_PATTERN.exec(lastChild.value)
  if (!match) return { classes: [] }

  lastChild.value = lastChild.value.slice(0, match.index).trimEnd()
  if (lastChild.value.length === 0) node.children.pop()

  const tokens = (match[1] ?? '').trim().split(/\s+/).filter(Boolean)
  let id: string | undefined
  const classes: string[] = []
  for (const token of tokens) {
    if (token.startsWith('#')) id = token.slice(1)
    else if (token.startsWith('.')) classes.push(token.slice(1))
  }

  return { ...(id !== undefined && { id }), classes }
}

function dedupeId(baseId: string, seen: Map<string, number>): string {
  const count = seen.get(baseId) ?? 0
  seen.set(baseId, count + 1)
  return count === 0 ? baseId : `${baseId}-${count + 1}`
}

export function assignHeadingIds(tree: Root): void {
  const seen = new Map<string, number>()

  visit(tree, 'heading', (node: Heading) => {
    const { id: explicitId, classes } = extractHeadingAttrs(node)
    const id = dedupeId(explicitId ?? slugify(toString(node)), seen)
    node.data = {
      ...node.data,
      hProperties: {
        ...node.data?.hProperties,
        id,
        ...(classes.length > 0 && { className: classes }),
      },
    }
  })
}
