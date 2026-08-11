import { visit } from 'unist-util-visit'
import type { Node } from 'unist'
import type { Root } from 'mdast'

const DIRECTIVE_NODE_TYPES = new Set(['containerDirective', 'leafDirective', 'textDirective'])

interface DirectiveNode extends Node {
  name: string
  attributes?: Record<string, string | null | undefined>
}

function isDirectiveNode(node: Node): node is DirectiveNode {
  return DIRECTIVE_NODE_TYPES.has(node.type)
}

export function directivesToHast() {
  return (tree: Root) => {
    visit(tree, (node) => {
      if (!isDirectiveNode(node)) return

      const classNames = [node.name]
      const properties: Record<string, string> = {}

      for (const [key, value] of Object.entries(node.attributes ?? {})) {
        if (value === null || value === undefined) continue
        if (key === 'class') {
          classNames.push(...value.split(' ').filter(Boolean))
          continue
        }
        if (key === 'id') {
          properties['id'] = value
          continue
        }
        properties[`data-${key}`] = value
      }

      node.data = {
        ...node.data,
        hName: node.type === 'textDirective' ? 'span' : 'div',
        hProperties: { ...properties, className: classNames },
      }
    })
  }
}
