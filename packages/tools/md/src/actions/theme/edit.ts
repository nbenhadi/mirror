import type { ToolContext, ToolResult } from '@nbenhadi/mirror-core'
import type { ThemeEditInput } from '../../schema.js'
import { editableThemeCssPath } from '../../engine/themes.js'

export interface ThemeEditResult {
  id: string
  cssPath: string
}

export async function themeEdit(
  input: ThemeEditInput,
  _ctx: ToolContext
): Promise<ToolResult<ThemeEditResult>> {
  const cssPath = await editableThemeCssPath(input.name)
  if (!cssPath) {
    return {
      success: false,
      error: {
        code: 'NOT_FOUND',
        message: 'cmd.md.error.theme_not_found',
        params: { name: input.name },
      },
    }
  }

  return { success: true, data: { id: input.name, cssPath } }
}
