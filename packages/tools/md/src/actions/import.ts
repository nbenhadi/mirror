import { readFile, writeFile } from 'node:fs/promises'
import { dirname, extname } from 'node:path'
import type { ToolContext, ToolResult } from '@nbenhadi/mirror-core'
import type { ImportInput } from '../schema.js'
import { convertHtmlToMarkdown } from '../engine/import/from-html.js'
import { convertDocxToMarkdown } from '../engine/import/from-docx.js'
import { convertPdfToMarkdown } from '../engine/import/from-pdf.js'
import { resolveOutputPath, normalizePath, ensureDir } from '../engine/fs-paths.js'

export interface ImportResult {
  path: string
}

type Converter = (path: string) => Promise<string>

const CONVERTER_BY_EXTENSION: Record<string, Converter> = {
  '.html': async (path) => convertHtmlToMarkdown(await readFile(path, 'utf-8')),
  '.htm': async (path) => convertHtmlToMarkdown(await readFile(path, 'utf-8')),
  '.docx': convertDocxToMarkdown,
  '.pdf': convertPdfToMarkdown,
}

function resolveConverter(input: ImportInput): Converter | undefined {
  return CONVERTER_BY_EXTENSION[extname(input.path).toLowerCase()]
}

function isNotFoundError(err: unknown): boolean {
  return err instanceof Error && 'code' in err && (err as NodeJS.ErrnoException).code === 'ENOENT'
}

export async function importDocument(
  input: ImportInput,
  _ctx: ToolContext
): Promise<ToolResult<ImportResult>> {
  const normalizedInput = normalizePath(input)
  const converter = resolveConverter(normalizedInput)
  if (!converter) {
    return {
      success: false,
      error: {
        code: 'VALIDATION_ERROR',
        message: 'cmd.md.import.error.unknown_format',
        params: { path: normalizedInput.path },
      },
    }
  }

  let markdown: string
  try {
    markdown = await converter(normalizedInput.path)
  } catch (err) {
    if (isNotFoundError(err)) {
      return {
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: 'error.not_found',
          params: { path: normalizedInput.path },
        },
      }
    }
    return {
      success: false,
      error: {
        code: 'EXECUTION_ERROR',
        message: 'cmd.md.import.error.convert_failed',
        params: { path: normalizedInput.path },
      },
    }
  }

  const outputPath = await resolveOutputPath(normalizedInput.path, normalizedInput.output, '.md')
  await ensureDir(dirname(outputPath))
  await writeFile(outputPath, markdown, 'utf-8')

  return { success: true, data: { path: outputPath } }
}
