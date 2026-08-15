import type { Root } from 'mdast'
import type { FrontMatter } from '../engine/parse.js'
import type { ExportInput } from '../schema.js'

export interface RenderContext {
  sourcePath: string
  frontMatter: FrontMatter
  format: ExportInput['format']
  state: Record<string, unknown>
}

export type AfterExportResult = { rerender: boolean } | void

export interface MdPlugin {
  id: string
  transformSource?(source: string, ctx: RenderContext): string | Promise<string>
  transformAst?(tree: Root, ctx: RenderContext): void | Promise<void>
  transformHtml?(html: string, ctx: RenderContext): string | Promise<string>
  afterExport?(
    outputPath: string,
    ctx: RenderContext
  ): AfterExportResult | Promise<AfterExportResult>
}
