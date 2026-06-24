import type { ToolContext, ToolResult } from '@nbenhadi/mirror-core'
import { writeVault } from '../vault-file.js'
import { withVaultSession } from '../vault-helpers.js'

type PurgeInput = { action: 'purge'; title?: string | undefined }
type PurgeResult = { title: string; count?: never } | { count: number; title?: never }

export async function purge(
  input: PurgeInput,
  _ctx: ToolContext
): Promise<ToolResult<PurgeResult>> {
  return withVaultSession<PurgeResult>(async ({ session, key, vault }) => {
    if (input.title === undefined) {
      const before = vault.entries.length
      vault.entries = vault.entries.filter((e) => e.deleted_at === undefined)
      const count = before - vault.entries.length
      if (count > 0) await writeVault(session.vaultPath, vault, key)
      return { success: true, data: { count } }
    }

    const title = input.title
    const idx = vault.entries.findIndex(
      (e) => e.title.toLowerCase() === title.toLowerCase() && e.deleted_at !== undefined
    )

    if (idx === -1) {
      return {
        success: false,
        error: { code: 'NOT_FOUND', message: 'tool.vault.error.not_in_trash', params: { title } },
      }
    }

    const removed = vault.entries.splice(idx, 1)[0]!
    await writeVault(session.vaultPath, vault, key)

    return { success: true, data: { title: removed.title } }
  })
}
