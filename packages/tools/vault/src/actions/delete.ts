import type { ToolContext, ToolResult } from '@mirror/core'
import { loadSession } from '../session.js'
import { readVault, writeVault } from '../vault-file.js'

type DeleteInput = { action: 'delete'; title: string; force: boolean }

export async function deleteEntry(
  input: DeleteInput,
  _ctx: ToolContext
): Promise<ToolResult<{ title: string; permanent: boolean }>> {
  const session = await loadSession()
  if (!session) {
    return { success: false, error: { code: 'UNAUTHORIZED', message: 'Vault is locked' } }
  }

  const key = Buffer.from(session.key, 'base64')
  const vault = await readVault(session.vaultPath, key)

  const idx = vault.entries.findIndex(
    (e) => e.title.toLowerCase() === input.title.toLowerCase() && !e.deleted_at
  )

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
