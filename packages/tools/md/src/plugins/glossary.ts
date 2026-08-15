import { visit } from 'unist-util-visit'
import { toString } from 'mdast-util-to-string'
import type { Root, Table, TableRow, TableCell, Text as MdastText } from 'mdast'
import type { ElementContent } from 'hast'
import { slugify } from '../engine/anchors.js'
import { isDirectiveNode, type DirectiveNode } from '../engine/directives.js'
import { resolveAnchorPages } from '../engine/pdf-text.js'
import { toNumber, toBoolean } from './directive-attrs.js'
import type { MdPlugin, RenderContext, AfterExportResult } from './types.js'

const ANCHOR_PREFIX = 'glossary-term-'
const BLOCKS_STATE_KEY = 'glossaryBlocks'
const PAGES_STATE_KEY = 'glossaryPages'

interface GlossaryEntry {
  row: TableRow
  term: string
  termId: string
  pageCell: TableCell | undefined
}

interface Match {
  start: number
  end: number
  entry: GlossaryEntry
}

interface ParentLike {
  children?: unknown[]
}

interface BlockState {
  anchorIdsByTerm: Record<string, string[]>
  skipPages: number[]
}

function isParentLike(node: unknown): node is ParentLike & { children: unknown[] } {
  return typeof node === 'object' && node !== null && Array.isArray((node as ParentLike).children)
}

function findTable(node: ParentLike): Table | undefined {
  for (const child of node.children ?? []) {
    if (isParentLike(child) && (child as { type?: string }).type === 'table') {
      return child as Table
    }
  }
  return undefined
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

function parsePageRanges(input: string | undefined): Set<number> {
  const pages = new Set<number>()
  if (!input) return pages

  for (const part of input.split(',')) {
    const trimmed = part.trim()
    if (!trimmed) continue
    const [startStr, endStr] = trimmed.split('-')
    const start = Number(startStr)
    if (!Number.isFinite(start)) continue
    const end = endStr !== undefined ? Number(endStr) : start
    if (!Number.isFinite(end)) continue
    for (let page = start; page <= end; page++) pages.add(page)
  }

  return pages
}

function resolvePageColumnIndex(
  configured: number | undefined,
  columnCount: number
): number | undefined {
  if (configured !== undefined) {
    const index = configured - 1
    return index >= 0 && index < columnCount ? index : undefined
  }
  return columnCount >= 3 ? columnCount - 1 : undefined
}

function collectEntries(table: Table, pageColumnIndex: number | undefined): GlossaryEntry[] {
  const [, ...rows] = table.children
  const entries: GlossaryEntry[] = []

  for (const row of rows) {
    const termCell = row.children[0]
    if (!termCell) continue
    const term = toString(termCell).trim()
    if (!term) continue

    entries.push({
      row,
      term,
      termId: slugify(term),
      pageCell: pageColumnIndex !== undefined ? row.children[pageColumnIndex] : undefined,
    })
  }

  return entries
}

function findMatches(value: string, entries: GlossaryEntry[]): Match[] {
  const candidates: Match[] = []

  for (const entry of entries) {
    const pattern = new RegExp(
      `(?<![\\p{L}\\p{N}])${escapeRegExp(entry.term)}(?![\\p{L}\\p{N}])`,
      'giu'
    )
    let match: RegExpExecArray | null
    while ((match = pattern.exec(value))) {
      candidates.push({ start: match.index, end: match.index + match[0].length, entry })
      if (match[0].length === 0) pattern.lastIndex++
    }
  }

  candidates.sort((a, b) => a.start - b.start || b.end - b.start - (a.end - a.start))

  const accepted: Match[] = []
  let lastEnd = -1
  for (const candidate of candidates) {
    if (candidate.start < lastEnd) continue
    accepted.push(candidate)
    lastEnd = candidate.end
  }

  return accepted
}

function wrapMatches(
  value: string,
  matches: Match[],
  anchorIdsByTerm: Map<string, string[]>,
  highlight: boolean
): MdastText[] {
  const parts: MdastText[] = []
  let cursor = 0

  for (const match of matches) {
    if (match.start > cursor) {
      parts.push({ type: 'text', value: value.slice(cursor, match.start) })
    }

    const existing = anchorIdsByTerm.get(match.entry.termId) ?? []
    const anchorId = `${ANCHOR_PREFIX}${match.entry.termId}-${existing.length}`
    anchorIdsByTerm.set(match.entry.termId, [...existing, anchorId])

    const matchedText = value.slice(match.start, match.end)
    const hChildren: ElementContent[] = [{ type: 'text', value: matchedText }]

    parts.push({
      type: 'text',
      value: matchedText,
      data: {
        hName: 'span',
        hProperties: {
          id: anchorId,
          ...(highlight && { className: ['glossary-term'], 'data-term': match.entry.termId }),
        },
        hChildren: [...hChildren],
      },
    })

    parts.push({
      type: 'text',
      value: '',
      data: {
        hName: 'a',
        hProperties: {
          href: `#${anchorId}`,
          style: 'width: 0; height: 0; overflow: hidden; display: inline-block;',
        },
        hChildren: [],
      },
    })

    cursor = match.end
  }

  if (cursor < value.length) {
    parts.push({ type: 'text', value: value.slice(cursor) })
  }

  return parts
}

function markSubtree(node: unknown, skip: Set<unknown>): void {
  if (!isParentLike(node)) return
  visit(node as Root, (child) => {
    skip.add(child)
  })
}

function scanAndWrapOccurrences(
  tree: Root,
  entries: GlossaryEntry[],
  skip: Set<unknown>,
  highlight: boolean
): Map<string, string[]> {
  const anchorIdsByTerm = new Map<string, string[]>()

  visit(tree, 'text', (node, index, parent) => {
    if (!parent || index === undefined || skip.has(node)) return
    const matches = findMatches(node.value, entries)
    if (matches.length === 0) return

    const replacement = wrapMatches(node.value, matches, anchorIdsByTerm, highlight)
    parent.children.splice(index, 1, ...replacement)
    return index + replacement.length
  })

  return anchorIdsByTerm
}

function countOccurrences(
  tree: Root,
  entries: GlossaryEntry[],
  skip: Set<unknown>
): Map<string, number> {
  const counts = new Map<string, number>()

  visit(tree, 'text', (node) => {
    if (skip.has(node)) return
    for (const match of findMatches(node.value, entries)) {
      counts.set(match.entry.termId, (counts.get(match.entry.termId) ?? 0) + 1)
    }
  })

  return counts
}

function setCellText(cell: TableCell, text: string): void {
  cell.children = [{ type: 'text', value: text }]
}

function renderTable(
  table: Table,
  entries: GlossaryEntry[],
  resolvedPages: Record<string, number> | undefined,
  prune: boolean,
  sortByPage: boolean
): void {
  const [header] = table.children
  if (!header) return

  const usable = entries.filter((entry) => {
    if (!prune) return true
    return resolvedPages ? resolvedPages[entry.termId] !== undefined : true
  })

  for (const entry of usable) {
    const page = resolvedPages?.[entry.termId]
    if (entry.pageCell && page !== undefined) setCellText(entry.pageCell, String(page))
  }

  const rows = sortByPage
    ? [...usable].sort((a, b) => {
        const pageA = resolvedPages?.[a.termId] ?? Number.POSITIVE_INFINITY
        const pageB = resolvedPages?.[b.termId] ?? Number.POSITIVE_INFINITY
        return pageA - pageB
      })
    : usable

  table.children = [header, ...rows.map((entry) => entry.row)]
}

function readBlocks(ctx: RenderContext): BlockState[] {
  const stored = ctx.state[BLOCKS_STATE_KEY]
  return Array.isArray(stored) ? (stored as BlockState[]) : []
}

function readPages(ctx: RenderContext): Record<string, number>[] {
  const stored = ctx.state[PAGES_STATE_KEY]
  return Array.isArray(stored) ? (stored as Record<string, number>[]) : []
}

export function createGlossaryPlugin(): MdPlugin {
  return {
    id: 'glossary',

    transformAst(tree: Root, ctx: RenderContext) {
      const blocks: BlockState[] = []
      const pagesByBlock = readPages(ctx)
      let blockIndex = 0

      visit(tree, (node) => {
        if (!isDirectiveNode(node) || node.name !== 'glossary') return
        const directive = node as DirectiveNode & ParentLike

        const table = findTable(directive)
        if (!table) return

        const header = table.children[0]
        const columnCount = header?.children.length ?? 0
        const pageColumnIndex = resolvePageColumnIndex(
          toNumber(directive.attributes?.['pageColumn']),
          columnCount
        )
        const skipPages = parsePageRanges(directive.attributes?.['skipPages'] ?? undefined)
        const prune = toBoolean(directive.attributes?.['prune']) ?? false
        const highlight = toBoolean(directive.attributes?.['highlight']) ?? true
        const hasPageColumn = pageColumnIndex !== undefined

        const entries = collectEntries(table, pageColumnIndex)
        const skip = new Set<unknown>()
        markSubtree(table, skip)

        const needsPdfResolution =
          ctx.format === 'pdf' && (hasPageColumn || prune || skipPages.size > 0)

        const currentIndex = blockIndex
        blockIndex++
        const resolved = pagesByBlock[currentIndex]

        if (needsPdfResolution) {
          const anchorIdsByTerm = scanAndWrapOccurrences(tree, entries, skip, highlight)
          blocks.push({
            anchorIdsByTerm: Object.fromEntries(anchorIdsByTerm),
            skipPages: [...skipPages],
          })
          renderTable(table, entries, resolved, prune, hasPageColumn)
          return
        }

        if (prune) {
          const counts = countOccurrences(tree, entries, skip)
          const used = entries.filter((entry) => (counts.get(entry.termId) ?? 0) > 0)
          renderTable(table, used, undefined, false, false)
        }
      })

      if (blocks.length > 0) ctx.state[BLOCKS_STATE_KEY] = blocks
    },

    async afterExport(outputPath: string, ctx: RenderContext): Promise<AfterExportResult> {
      const blocks = readBlocks(ctx)
      if (blocks.length === 0) return

      const allIds = blocks.flatMap((block) => Object.values(block.anchorIdsByTerm).flat())
      if (allIds.length === 0) return

      const resolved = await resolveAnchorPages(outputPath, allIds)

      const pagesByBlock = blocks.map((block) => {
        const skipSet = new Set(block.skipPages)
        const termPages: Record<string, number> = {}

        for (const [termId, ids] of Object.entries(block.anchorIdsByTerm)) {
          const candidates = ids
            .map((id) => resolved[id])
            .filter((page): page is number => page !== undefined && !skipSet.has(page))
          if (candidates.length > 0) termPages[termId] = Math.min(...candidates)
        }

        return termPages
      })

      ctx.state[PAGES_STATE_KEY] = pagesByBlock
      return { rerender: true }
    },
  }
}
