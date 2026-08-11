import { dirname } from 'node:path'
import { parseFrontMatter, parseMarkdownAst, astToHtml } from './parse.js'
import { buildHtmlDocument } from './html.js'
import { assignHeadingIds } from './anchors.js'
import { assignImageAttrs } from './image-attrs.js'
import { resolveThemeCss, resolveThemeMargins } from './themes.js'
import { loadPlugins } from '../plugins/registry.js'
import type { MdPlugin, RenderContext } from '../plugins/types.js'
import type { ExportInput } from '../schema.js'

export interface PreparedPipeline {
  content: string
  plugins: MdPlugin[]
  renderContext: RenderContext
}

export async function preparePipeline(
  sourcePath: string,
  source: string,
  format: ExportInput['format']
): Promise<PreparedPipeline> {
  const { frontMatter, content } = parseFrontMatter(source)
  frontMatter.theme ??= 'default'
  const plugins = await loadPlugins(frontMatter.plugins ?? [], dirname(sourcePath))
  const renderContext: RenderContext = { sourcePath, frontMatter, format, state: {} }

  return { content, plugins, renderContext }
}

export async function renderHtml(
  content: string,
  plugins: MdPlugin[],
  renderContext: RenderContext,
  includeBaseTag = true
): Promise<string> {
  const tree = await parseMarkdownAst(content)
  assignHeadingIds(tree)
  assignImageAttrs(tree)

  for (const plugin of plugins) {
    if (plugin.transformAst) await plugin.transformAst(tree, renderContext)
  }

  let bodyHtml = await astToHtml(tree)
  for (const plugin of plugins) {
    if (plugin.transformHtml) bodyHtml = await plugin.transformHtml(bodyHtml, renderContext)
  }

  const themeCss = await resolveThemeCss(renderContext.frontMatter.theme ?? 'default')
  const margins = await resolveThemeMargins(renderContext.frontMatter.theme ?? 'default')

  return buildHtmlDocument(
    bodyHtml,
    renderContext.frontMatter,
    themeCss,
    includeBaseTag ? dirname(renderContext.sourcePath) : undefined,
    renderContext.format,
    margins
  )
}
