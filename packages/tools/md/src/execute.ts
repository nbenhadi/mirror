import type { ToolContext, ToolResult } from '@nbenhadi/mirror-core'
import type { MdInput } from './schema.js'
import { exportMarkdown } from './actions/export.js'
import { preview } from './actions/preview.js'
import { importDocument } from './actions/import.js'
import { edit } from './actions/edit.js'
import { slides } from './actions/slides.js'
import { themeCreate } from './actions/theme/create.js'
import { themeList } from './actions/theme/list.js'
import { themeEdit } from './actions/theme/edit.js'
import { themeDelete } from './actions/theme/delete.js'

export async function execute(input: MdInput, ctx: ToolContext): Promise<ToolResult<unknown>> {
  switch (input.action) {
    case 'export':
      return exportMarkdown(input, ctx)
    case 'preview':
      return preview(input, ctx)
    case 'import':
      return importDocument(input, ctx)
    case 'edit':
      return edit(input, ctx)
    case 'slides':
      return slides(input, ctx)
    case 'theme.create':
      return themeCreate(input, ctx)
    case 'theme.list':
      return themeList(input, ctx)
    case 'theme.edit':
      return themeEdit(input, ctx)
    case 'theme.delete':
      return themeDelete(input, ctx)
  }
}
