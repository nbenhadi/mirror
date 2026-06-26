import type { ToolContext, ToolResult } from '@nbenhadi/mirror-core'
import { writeVault } from '../vault-file.js'
import { withVaultSession } from '../vault-helpers.js'

type RestoreInput = { action: 'restore'; title: string }

export async function restore(
  input: RestoreInput,
  _ctx: ToolContext
): Promise<ToolResult<{ title: string }>> {
  return withVaultSession(async ({ session, key, vault }) => {
    const entry = vault.entries.find(
      (e) => e.title.toLowerCase() === input.title.toLowerCase() && e.deleted_at !== undefined
    )

    if (!entry) {
      return {
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: 'tool.vault.error.not_in_trash',
          params: { title: input.title },
        },
      }
    }

    delete entry.deleted_at
    entry.updated_at = new Date().toISOString()
    await writeVault(session.vaultPath, vault, key)

    return { success: true, data: { title: entry.title } }
  })
}
