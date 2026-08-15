import { dirname } from 'node:path'
import type { ToolContext, ToolResult } from '@nbenhadi/mirror-core'
import type { ExportInput } from '../schema.js'
import { preparePipeline, renderHtml, type PreparedPipeline } from '../engine/pipeline.js'
import { exportDocument, isPageRangeError, toPlaywrightToolError } from '../engine/export-pdf.js'
import { isInvalidPluginError } from '../plugins/registry.js'
import { isTemplateDataError } from '../plugins/template.js'
import { isInvalidFrontMatterError } from '../engine/parse.js'
import { resolveOutputPath, normalizePath, readSourceFile, ensureDir } from '../engine/fs-paths.js'
import { buildHeaderFooterTemplate, type HeaderFooterStyle } from '../engine/header-footer.js'
import { resolveThemeMargins } from '../engine/themes.js'
import { resolvePaperColor, resolveAccentTokens, FONT_SANS } from '../themes/default.js'

const DEFAULT_THEME_HEADER_FOOTER_FONT_PX = 12

export interface ExportResult {
  path: string
}

const EXTENSION_BY_FORMAT: Record<ExportInput['format'], string> = {
  pdf: '.pdf',
  html: '.html',
  png: '.png',
}

export async function exportMarkdown(
  input: ExportInput,
  _ctx: ToolContext
): Promise<ToolResult<ExportResult>> {
  const normalizedInput = normalizePath(input)
  const read = await readSourceFile(normalizedInput.path)
  if (!read.success) return read
  const source = read.content

  let prepared: PreparedPipeline
  try {
    prepared = await preparePipeline(normalizedInput.path, source, normalizedInput.format)
  } catch (err) {
    if (isInvalidPluginError(err)) {
      return {
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'cmd.md.export.error.invalid_plugin',
          params: { plugin: err.message.replace('invalid md plugin: ', '') },
        },
      }
    }
    if (isInvalidFrontMatterError(err)) {
      return {
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'cmd.md.error.invalid_frontmatter',
          params: { path: normalizedInput.path },
        },
      }
    }
    throw err
  }
  const { content, plugins, renderContext } = prepared

  if (normalizedInput.theme) {
    renderContext.frontMatter = { ...renderContext.frontMatter, theme: normalizedInput.theme }
  }

  const outputPath = await resolveOutputPath(
    normalizedInput.path,
    normalizedInput.output,
    EXTENSION_BY_FORMAT[normalizedInput.format]
  )

  await ensureDir(dirname(outputPath))

  const baseDir = dirname(normalizedInput.path)

  let headerFooterStyle: HeaderFooterStyle | undefined
  if (renderContext.frontMatter.header || renderContext.frontMatter.footer) {
    const themeId = renderContext.frontMatter.theme ?? 'default'
    const paperColor =
      themeId === 'default' ? resolvePaperColor(renderContext.frontMatter.paper) : '#ffffff'
    const textColor =
      themeId === 'default'
        ? resolveAccentTokens(renderContext.frontMatter.accent).inkMuted
        : '#64748b'

    headerFooterStyle = {
      paperColor,
      textColor,
      fontFamily: FONT_SANS,
      fontSizePx: DEFAULT_THEME_HEADER_FOOTER_FONT_PX,
      margins: await resolveThemeMargins(themeId),
    }
  }

  const header = renderContext.frontMatter.header
    ? await buildHeaderFooterTemplate(renderContext.frontMatter.header, baseDir, headerFooterStyle)
    : undefined
  const footer = renderContext.frontMatter.footer
    ? await buildHeaderFooterTemplate(renderContext.frontMatter.footer, baseDir, headerFooterStyle)
    : undefined

  const themeId = renderContext.frontMatter.theme ?? 'default'
  const margins = await resolveThemeMargins(themeId)

  const exportOptions = {
    format: input.format,
    outputPath,
    baseDir,
    margins,
    ...(input.pages !== undefined && { pages: input.pages }),
    ...(header !== undefined && { header }),
    ...(footer !== undefined && { footer }),
  }

  try {
    const html = await renderHtml(content, plugins, renderContext)
    await exportDocument(html, exportOptions)

    let needsRerender = false
    for (const plugin of plugins) {
      if (!plugin.afterExport) continue
      const result = await plugin.afterExport(outputPath, renderContext)
      if (result?.rerender) needsRerender = true
    }

    if (needsRerender) {
      const finalHtml = await renderHtml(content, plugins, renderContext)
      await exportDocument(finalHtml, exportOptions)
    }
  } catch (err) {
    if (isPageRangeError(err)) {
      return {
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'cmd.md.export.error.invalid_page_range',
          params: { pages: input.pages ?? '' },
        },
      }
    }
    if (isTemplateDataError(err)) {
      return {
        success: false,
        error: { code: 'VALIDATION_ERROR', message: 'cmd.md.export.error.invalid_template_data' },
      }
    }
    const playwrightError = toPlaywrightToolError(err)
    if (playwrightError) return { success: false, error: playwrightError }
    throw err
  }

  return { success: true, data: { path: outputPath } }
}
