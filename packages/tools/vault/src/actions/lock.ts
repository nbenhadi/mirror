import type { ToolContext, ToolResult } from '@mirror/core'
import { clearSession } from '../session.js'

export async function lock(
  _input: { action: 'lock' },
  _ctx: ToolContext
): Promise<ToolResult<{ locked: true }>> {
  await clearSession()
  return { success: true, data: { locked: true } }
}
