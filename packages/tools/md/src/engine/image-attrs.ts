import { visit } from 'unist-util-visit'
import type { Image, Parent, Root } from 'mdast'

const IMAGE_ATTR_PATTERN = /^\{([^}]*)\}/
const ATTR_ENTRY_PATTERN = /([\w-]+)\s*=\s*("[^"]*"|'[^']*'|[^;\s]+);?/g

function unquote(value: string): string {
  if (
    (value.startsWith('"') && value.endsWith('"')) ||
    (value.startsWith("'") && value.endsWith("'"))
  ) {
    return value.slice(1, -1)
  }
  return value
}

function toCssLength(value: string): string {
  return /^\d+$/.test(value) ? `${value}px` : value
}

function buildStyle(attrs: string): string | undefined {
  const declarations: string[] = []

  for (const match of attrs.matchAll(ATTR_ENTRY_PATTERN)) {
    const key = match[1]
    const value = unquote(match[2] ?? '')
    if (!key || !value) continue
    const isLength = key === 'width' || key === 'height'
    declarations.push(`${key}:${isLength ? toCssLength(value) : value}`)
  }

  return declarations.length > 0 ? declarations.join(';') : undefined
}

export function assignImageAttrs(tree: Root): void {
  visit(tree, 'image', (node: Image, index: number | undefined, parent: Parent | undefined) => {
    if (!parent || index === undefined) return

    const next = parent.children[index + 1]
    if (!next || next.type !== 'text') return

    const match = IMAGE_ATTR_PATTERN.exec(next.value)
    if (!match) return

    const style = buildStyle(match[1] ?? '')
    if (style) {
      node.data = { ...node.data, hProperties: { ...node.data?.hProperties, style } }
    }

    const remainder = next.value.slice(match[0].length)
    if (remainder.length === 0) {
      parent.children.splice(index + 1, 1)
    } else {
      next.value = remainder
    }
  })
}
