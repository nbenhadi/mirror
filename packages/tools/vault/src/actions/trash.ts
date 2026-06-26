import type { ToolContext, ToolResult } from '@nbenhadi/mirror-core'
import { withVaultSession } from '../vault-helpers.js'

type TrashedEntry = {
  title: string
  username?: string
  deleted_at: string
}

export async function trash(
  _input: { action: 'trash' },
  _ctx: ToolContext
): Promise<ToolResult<{ entries: TrashedEntry[]; count: number }>> {
  return withVaultSession(async ({ vault }) => {
    const entries: TrashedEntry[] = vault.entries
      .filter((e): e is typeof e & { deleted_at: string } => e.deleted_at !== undefined)
      .map((e) => ({
        title: e.title,
        ...(e.username !== undefined && { username: e.username }),
        deleted_at: e.deleted_at,
      }))

    return { success: true, data: { entries, count: entries.length } }
  })
}
