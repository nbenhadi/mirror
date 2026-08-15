import { readFile } from 'node:fs/promises'
import { dirname, resolve, extname } from 'node:path'
import Handlebars from 'handlebars'
import { load as loadYaml } from 'js-yaml'
import type { MdPlugin, RenderContext } from './types.js'

export class TemplateDataError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'TemplateDataError'
  }
}

export function isTemplateDataError(err: unknown): err is TemplateDataError {
  return err instanceof TemplateDataError
}

async function readDataFile(path: string, sourceLabel: string): Promise<unknown> {
  let contents: string
  try {
    contents = await readFile(path, 'utf-8')
  } catch {
    throw new TemplateDataError(`template data file not found: ${sourceLabel}`)
  }

  const ext = extname(path).toLowerCase()

  try {
    if (ext === '.json') return JSON.parse(contents)
    if (ext === '.yaml' || ext === '.yml') return loadYaml(contents)
  } catch {
    throw new TemplateDataError(`could not parse template data file: ${sourceLabel}`)
  }

  throw new TemplateDataError(`unsupported template data file type: ${sourceLabel}`)
}

async function resolveData(raw: unknown, baseDir: string): Promise<unknown> {
  if (raw === undefined) return undefined
  if (typeof raw !== 'string') return raw
  return readDataFile(resolve(baseDir, raw), raw)
}

export function createTemplatePlugin(): MdPlugin {
  return {
    id: 'template',

    async transformSource(source: string, ctx: RenderContext): Promise<string> {
      const data = await resolveData(ctx.frontMatter.data, dirname(ctx.sourcePath))
      if (data === undefined) return source

      const template = Handlebars.compile(source, { noEscape: true })
      return template(data)
    },
  }
}
