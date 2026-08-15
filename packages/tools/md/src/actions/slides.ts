import { dirname } from 'node:path'
import type { ToolContext, ToolResult } from '@nbenhadi/mirror-core'
import type { SlidesInput } from '../schema.js'
import {
  parseSlidesSource,
  resolveSlidesTheme,
  renderSlides,
  buildSlidesHtmlDocument,
} from '../engine/marp.js'
import { exportSlides, toPlaywrightToolError } from '../engine/export-pdf.js'
import { resolveOutputPath, normalizePath, readSourceFile, ensureDir } from '../engine/fs-paths.js'
import { resolveThemeCss } from '../engine/themes.js'
import { isInvalidFrontMatterError } from '../engine/parse.js'
import { getBundledSlideTheme } from '../themes/slide-registry.js'

export interface SlidesResult {
  path: string
}

const EXTENSION_BY_FORMAT: Record<SlidesInput['format'], string> = {
  pdf: '.pdf',
  html: '.html',
}

export async function slides(
  input: SlidesInput,
  _ctx: ToolContext
): Promise<ToolResult<SlidesResult>> {
  const normalizedInput = normalizePath(input)

  const read = await readSourceFile(normalizedInput.path)
  if (!read.success) return read

  let parsed: ReturnType<typeof parseSlidesSource>
  try {
    parsed = parseSlidesSource(read.content)
  } catch (err) {
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

  const effectiveTheme = resolveSlidesTheme(parsed, normalizedInput.theme)

  let themeCss: string | undefined
  if (effectiveTheme && !getBundledSlideTheme(effectiveTheme)) {
    themeCss = await resolveThemeCss('slide', effectiveTheme)
    if (themeCss === undefined) {
      return {
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'cmd.md.slides.error.theme_not_found',
          params: { theme: effectiveTheme },
        },
      }
    }
  }

  const baseDir = dirname(normalizedInput.path)
  const { html, css } = renderSlides(parsed, normalizedInput.theme, themeCss)
  const document = buildSlidesHtmlDocument(html, css, baseDir)

  const outputPath = await resolveOutputPath(
    normalizedInput.path,
    normalizedInput.output,
    EXTENSION_BY_FORMAT[normalizedInput.format]
  )
  await ensureDir(dirname(outputPath))

  try {
    await exportSlides(document, {
      format: normalizedInput.format,
      outputPath,
      baseDir,
    })
  } catch (err) {
    const playwrightError = toPlaywrightToolError(err)
    if (playwrightError) return { success: false, error: playwrightError }
    throw err
  }

  return { success: true, data: { path: outputPath } }
}
