import { readFile, writeFile, mkdir } from 'node:fs/promises'
import { dirname, resolve, join, basename, extname } from 'node:path'
import type { ToolContext, ToolResult } from '@nbenhadi/mirror-core'
import type { ImportInput } from '../schema.js'
import { convertHtmlToMarkdown } from '../engine/import/from-html.js'
import { convertDocxToMarkdown } from '../engine/import/from-docx.js'
import { convertPdfToMarkdown } from '../engine/import/from-pdf.js'
import { isDirectoryLike } from '../engine/fs-paths.js'

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

function defaultOutputPath(sourcePath: string): string {
  const dir = dirname(sourcePath)
  const name = basename(sourcePath, extname(sourcePath))
  return resolve(dir, `${name}.md`)
}

async function resolveOutputPath(input: ImportInput): Promise<string> {
  if (!input.output) return defaultOutputPath(input.path)

  const resolved = resolve(input.output)

  if (await isDirectoryLike(input.output)) {
    const name = basename(input.path, extname(input.path))
    return join(resolved, `${name}.md`)
  }

  return resolved
}

function isNotFoundError(err: unknown): boolean {
  return err instanceof Error && 'code' in err && (err as NodeJS.ErrnoException).code === 'ENOENT'
}

export async function importDocument(
  input: ImportInput,
  _ctx: ToolContext
): Promise<ToolResult<ImportResult>> {
  const normalizedInput = { ...input, path: input.path.trim() }
  const converter = resolveConverter(normalizedInput)
  if (!converter) {
    return {
      success: false,
      error: { code: 'VALIDATION_ERROR', message: 'cmd.md.error.unknown_format' },
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
      error: { code: 'EXECUTION_ERROR', message: 'cmd.md.error.convert_failed' },
    }
  }

  const outputPath = await resolveOutputPath(normalizedInput)
  await mkdir(dirname(outputPath), { recursive: true })
  await writeFile(outputPath, markdown, 'utf-8')

  return { success: true, data: { path: outputPath } }
}
