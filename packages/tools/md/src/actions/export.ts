import { readFile, mkdir } from 'node:fs/promises'
import { dirname, resolve, basename, extname } from 'node:path'
import type { ToolContext, ToolResult } from '@nbenhadi/mirror-core'
import type { ExportInput } from '../schema.js'
import { preparePipeline, renderHtml } from '../engine/pipeline.js'
import { exportDocument, isPageRangeError } from '../engine/export-pdf.js'
import { isDirectoryLike } from '../engine/fs-paths.js'
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

function defaultFileName(sourcePath: string, format: ExportInput['format']): string {
  const name = basename(sourcePath, extname(sourcePath))
  return `${name}${EXTENSION_BY_FORMAT[format]}`
}

function defaultOutputPath(sourcePath: string, format: ExportInput['format']): string {
  const dir = dirname(sourcePath)
  return resolve(dir, defaultFileName(sourcePath, format))
}

async function resolveOutputPath(input: ExportInput): Promise<string> {
  if (!input.output) return defaultOutputPath(input.path, input.format)

  const resolved = resolve(input.output)

  if (await isDirectoryLike(input.output)) {
    return resolve(resolved, defaultFileName(input.path, input.format))
  }

  return resolved
}

export async function exportMarkdown(
  input: ExportInput,
  _ctx: ToolContext
): Promise<ToolResult<ExportResult>> {
  const normalizedInput = { ...input, path: input.path.trim() }
  let source: string
  try {
    source = await readFile(normalizedInput.path, 'utf-8')
  } catch {
    return {
      success: false,
      error: {
        code: 'NOT_FOUND',
        message: 'error.not_found',
        params: { path: normalizedInput.path },
      },
    }
  }

  const { content, plugins, renderContext } = await preparePipeline(
    normalizedInput.path,
    source,
    normalizedInput.format
  )

  if (normalizedInput.theme) {
    renderContext.frontMatter = { ...renderContext.frontMatter, theme: normalizedInput.theme }
  }

  const outputPath = await resolveOutputPath(normalizedInput)

  await mkdir(dirname(outputPath), { recursive: true })

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
    throw err
  }

  return { success: true, data: { path: outputPath } }
}
