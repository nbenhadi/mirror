import type { Tool } from '@nbenhadi/mirror-core'
import { t } from '@nbenhadi/mirror-i18n'
import { schema } from './schema.js'
import { execute } from './execute.js'
import type { MdInput } from './schema.js'

export const MD_TOOL_ID = 'md' as const

export const mdTool: Tool<MdInput, unknown> = {
  id: MD_TOOL_ID,
  description: t('cmd.md.description'),
  schema,
  execute,
}

export type { ExportResult } from './actions/export.js'
export type { PreviewResult } from './actions/preview.js'
export type { ImportResult } from './actions/import.js'
export type { EditResult } from './actions/edit.js'
export type { SlidesResult } from './actions/slides.js'
export type { ThemeCreateResult } from './actions/theme/create.js'
export type { ThemeListResult } from './actions/theme/list.js'
export type { ThemeEditResult } from './actions/theme/edit.js'
export type { ThemeDeleteResult } from './actions/theme/delete.js'
export type {
  MdInput,
  EditInput,
  ExportInput,
  ImportInput,
  PreviewInput,
  SlidesInput,
  ThemeCreateInput,
  ThemeListInput,
  ThemeEditInput,
  ThemeDeleteInput,
} from './schema.js'
export type { MdPlugin, RenderContext, AfterExportResult } from './plugins/types.js'
export type { ThemeInfo } from './engine/themes.js'
export type { ThemeKind } from './themes/types.js'
