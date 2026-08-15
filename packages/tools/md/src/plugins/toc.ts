import { visit } from 'unist-util-visit'
import { toString } from 'mdast-util-to-string'
import type { Heading, Root } from 'mdast'
import type { Element, ElementContent } from 'hast'
import { getHeadingId, getHeadingClasses } from '../engine/anchors.js'
import { isDirectiveNode } from '../engine/directives.js'
import { resolveAnchorPages } from '../engine/pdf-text.js'
import { toNumber, toBoolean } from './directive-attrs.js'
import type { MdPlugin, RenderContext, AfterExportResult } from './types.js'

const DEFAULT_MIN_DEPTH = 2
const DEFAULT_MAX_DEPTH = 3
const NO_TOC_CLASS = 'no-toc'
const HEADING_IDS_STATE_KEY = 'tocHeadingIds'
const PAGES_STATE_KEY = 'tocPages'
const NEEDS_PAGES_STATE_KEY = 'tocNeedsPageNumbers'

interface TocHeading {
  id: string
  depth: number
  text: string
}

function isPageMap(value: unknown): value is Record<string, number> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function isStringArray(value: unknown): value is string[] {
  return Array.isArray(value) && value.every((item) => typeof item === 'string')
}

function buildTocItem(
  entry: TocHeading,
  minDepth: number,
  showPages: boolean,
  pages: Record<string, number> | undefined
): Element {
  const linkChildren: ElementContent[] = [
    {
      type: 'element',
      tagName: 'span',
      properties: { className: ['toc-title'] },
      children: [{ type: 'text', value: entry.text }],
    },
  ]

  if (showPages) {
    const page = pages?.[entry.id]
    linkChildren.push({
      type: 'element',
      tagName: 'span',
      properties: { className: ['toc-page'] },
      children: typeof page === 'number' ? [{ type: 'text', value: String(page) }] : [],
    })
  }

  return {
    type: 'element',
    tagName: 'li',
    properties: {
      className: ['toc-item'],
      'data-level': entry.depth,
      'data-toc-level': entry.depth - minDepth,
      style: `--toc-level: ${entry.depth - minDepth}`,
    },
    children: [
      {
        type: 'element',
        tagName: 'a',
        properties: { className: ['toc-link'], href: `#${entry.id}` },
        children: linkChildren,
      },
    ],
  }
}

function buildTocList(
  entries: TocHeading[],
  minDepth: number,
  showPages: boolean,
  pages: Record<string, number> | undefined
): Element {
  return {
    type: 'element',
    tagName: 'ol',
    properties: { className: ['toc-list'] },
    children: entries.map((entry) => buildTocItem(entry, minDepth, showPages, pages)),
  }
}

export function createTocPlugin(): MdPlugin {
  return {
    id: 'toc',

    transformAst(tree: Root, ctx: RenderContext) {
      const headings: TocHeading[] = []
      visit(tree, 'heading', (node: Heading) => {
        const id = getHeadingId(node)
        if (!id) return
        if (getHeadingClasses(node).includes(NO_TOC_CLASS)) return
        headings.push({ id, depth: node.depth, text: toString(node) })
      })

      const storedPages = ctx.state[PAGES_STATE_KEY]
      const pages = isPageMap(storedPages) ? storedPages : undefined
      const neededIds = new Set<string>()

      visit(tree, (node) => {
        if (!isDirectiveNode(node) || node.name !== 'toc') return

        const minDepth = toNumber(node.attributes?.['minDepth']) ?? DEFAULT_MIN_DEPTH
        const maxDepth = toNumber(node.attributes?.['maxDepth']) ?? DEFAULT_MAX_DEPTH
        const pageNumbers = toBoolean(node.attributes?.['pageNumbers']) ?? false
        const showPages = pageNumbers && ctx.format === 'pdf'

        const entries = headings.filter((h) => h.depth >= minDepth && h.depth <= maxDepth)
        if (showPages) {
          for (const entry of entries) neededIds.add(entry.id)
        }

        node.data = {
          ...node.data,
          hName: 'nav',
          hProperties: { className: ['toc'] },
          hChildren: [buildTocList(entries, minDepth, showPages, pages)],
        }
      })

      if (neededIds.size > 0) {
        ctx.state[NEEDS_PAGES_STATE_KEY] = true
        ctx.state[HEADING_IDS_STATE_KEY] = [...neededIds]
      }
    },

    async afterExport(outputPath: string, ctx: RenderContext): Promise<AfterExportResult> {
      if (!ctx.state[NEEDS_PAGES_STATE_KEY]) return

      const ids = ctx.state[HEADING_IDS_STATE_KEY]
      if (!isStringArray(ids) || ids.length === 0) return

      ctx.state[PAGES_STATE_KEY] = await resolveAnchorPages(outputPath, ids)
      return { rerender: true }
    },
  }
}
