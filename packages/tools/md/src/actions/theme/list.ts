import type { ToolContext, ToolResult } from '@nbenhadi/mirror-core'
import type { ThemeListInput } from '../../schema.js'
import { listThemes, type ThemeInfo } from '../../engine/themes.js'

export interface ThemeListResult {
  themes: ThemeInfo[]
  count: number
}

export async function themeList(
  input: ThemeListInput,
  _ctx: ToolContext
): Promise<ToolResult<ThemeListResult>> {
  const themes = await listThemes(input.kind)
  return { success: true, data: { themes, count: themes.length } }
}
