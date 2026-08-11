import matter from 'gray-matter'
import { unified } from 'unified'
import remarkParse from 'remark-parse'
import remarkGfm from 'remark-gfm'
import remarkDirective from 'remark-directive'
import remarkRehype from 'remark-rehype'
import rehypeStringify from 'rehype-stringify'
import { directivesToHast } from './directives.js'
import type { Root } from 'mdast'

export type PluginEntry = string | ({ id: string } & Record<string, unknown>)

export type HeaderFooterItem = string | { text: string } | { image: string }
export type HeaderFooterSlotContent = HeaderFooterItem | HeaderFooterItem[]

export interface HeaderFooterConfig {
  left?: HeaderFooterSlotContent
  center?: HeaderFooterSlotContent
  right?: HeaderFooterSlotContent
}

export interface FrontMatter {
  title?: string
  author?: string
  lang?: string
  theme?: string
  paper?: string
  accent?: string
  plugins?: PluginEntry[]
  pages?: string
  header?: HeaderFooterConfig
  footer?: HeaderFooterConfig
}

export interface ParsedDocument {
  frontMatter: FrontMatter
  content: string
}

function isPluginEntry(value: unknown): value is PluginEntry {
  if (typeof value === 'string') return true
  return (
    typeof value === 'object' &&
    value !== null &&
    typeof (value as { id?: unknown }).id === 'string'
  )
}

function isPluginEntryArray(value: unknown): value is PluginEntry[] {
  return Array.isArray(value) && value.every(isPluginEntry)
}

function isHeaderFooterItem(value: unknown): value is HeaderFooterItem {
  if (typeof value === 'string') return true
  if (typeof value !== 'object' || value === null) return false
  const record = value as Record<string, unknown>
  return typeof record['text'] === 'string' || typeof record['image'] === 'string'
}

function isHeaderFooterSlotContent(value: unknown): value is HeaderFooterSlotContent {
  if (Array.isArray(value)) return value.length > 0 && value.every(isHeaderFooterItem)
  return isHeaderFooterItem(value)
}

function parseHeaderFooterConfig(value: unknown): HeaderFooterConfig | undefined {
  if (typeof value !== 'object' || value === null) return undefined

  const record = value as Record<string, unknown>
  const config: HeaderFooterConfig = {
    ...(isHeaderFooterSlotContent(record['left']) && { left: record['left'] }),
    ...(isHeaderFooterSlotContent(record['center']) && { center: record['center'] }),
    ...(isHeaderFooterSlotContent(record['right']) && { right: record['right'] }),
  }

  return Object.keys(config).length > 0 ? config : undefined
}

export function parseFrontMatter(source: string): ParsedDocument {
  const { data, content } = matter(source)

  const header = parseHeaderFooterConfig(data['header'])
  const footer = parseHeaderFooterConfig(data['footer'])

  const frontMatter: FrontMatter = {
    ...(typeof data['title'] === 'string' && { title: data['title'] }),
    ...(typeof data['author'] === 'string' && { author: data['author'] }),
    ...(typeof data['lang'] === 'string' && { lang: data['lang'] }),
    ...(typeof data['theme'] === 'string' && { theme: data['theme'] }),
    ...(typeof data['paper'] === 'string' && { paper: data['paper'] }),
    ...(typeof data['accent'] === 'string' && { accent: data['accent'] }),
    ...(isPluginEntryArray(data['plugins']) && { plugins: data['plugins'] }),
    ...(typeof data['pages'] === 'string' && { pages: data['pages'] }),
    ...(header && { header }),
    ...(footer && { footer }),
  }

  return { frontMatter, content }
}

export async function parseMarkdownAst(markdown: string): Promise<Root> {
  const processor = unified()
    .use(remarkParse)
    .use(remarkGfm)
    .use(remarkDirective)
    .use(directivesToHast)
  const tree = processor.parse(markdown)
  await processor.run(tree)
  return tree
}

export async function astToHtml(tree: Root): Promise<string> {
  const hastTree = await unified().use(remarkRehype).run(tree)
  return unified().use(rehypeStringify).stringify(hastTree)
}

export async function markdownToHtmlBody(markdown: string): Promise<string> {
  const tree = await parseMarkdownAst(markdown)
  return astToHtml(tree)
}
