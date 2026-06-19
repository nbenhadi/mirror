import type { ToolContext, ToolResult } from '@nbenhadi/mirror-core'
import { writeVault } from '../vault-file.js'
import { loadVaultSession, findActiveEntryIndex } from '../vault-helpers.js'

type DeleteInput = { action: 'delete'; title: string; force: boolean }

export async function deleteEntry(
  input: DeleteInput,
  _ctx: ToolContext
): Promise<ToolResult<{ title: string; permanent: boolean }>> {
  const loaded = await loadVaultSession()
  if (!loaded.success) return loaded

  const { session, key, vault } = loaded.data
  const idx = findActiveEntryIndex(vault.entries, input.title)

  if (idx === -1) {
    return {
      success: false,
      error: { code: 'NOT_FOUND', message: `Entry "${input.title}" not found` },
    }
  }

  const entry = vault.entries[idx]!

  if (input.force) {
    vault.entries.splice(idx, 1)
  } else {
    const now = new Date().toISOString()
    entry.deleted_at = now
    entry.updated_at = now
  }

  await writeVault(session.vaultPath, vault, key)

  return { success: true, data: { title: entry.title, permanent: input.force } }
}
