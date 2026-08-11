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

const HEADING_ATTR_PATTERN = /\s*\{([^}]*)\}\s*$/

function extractExplicitId(node: Heading): string | undefined {
  const lastChild = node.children[node.children.length - 1]
  if (!lastChild || lastChild.type !== 'text') return undefined

  const match = HEADING_ATTR_PATTERN.exec(lastChild.value)
  if (!match) return undefined

  const idMatch = /#([^\s.{}]+)/.exec(match[1] ?? '')
  lastChild.value = lastChild.value.slice(0, match.index).trimEnd()
  if (lastChild.value.length === 0) node.children.pop()

  return idMatch?.[1]
}

export function assignHeadingIds(tree: Root): void {
  visit(tree, 'heading', (node: Heading) => {
    const explicitId = extractExplicitId(node)
    const id = explicitId ?? slugify(toString(node))
    node.data = {
      ...node.data,
      hProperties: { ...node.data?.hProperties, id },
    }
  })
}
