import type { ToolContext, ToolResult } from '@mirror/core'
import { loadSession } from '../session.js'
import { readVault, writeVault } from '../vault-file.js'

type RestoreInput = { action: 'restore'; title: string }

export async function restore(
  input: RestoreInput,
  _ctx: ToolContext
): Promise<ToolResult<{ title: string }>> {
  const session = await loadSession()
  if (!session) {
    return { success: false, error: { code: 'UNAUTHORIZED', message: 'Vault is locked' } }
  }

  const key = Buffer.from(session.key, 'base64')
  const vault = await readVault(session.vaultPath, key)

  const entry = vault.entries.find(
    (e) => e.title.toLowerCase() === input.title.toLowerCase() && e.deleted_at !== undefined
  )

  if (!entry) {
    return {
      success: false,
      error: { code: 'NOT_FOUND', message: `"${input.title}" not found in trash` },
    }
  }

  delete entry.deleted_at
  entry.updated_at = new Date().toISOString()
  await writeVault(session.vaultPath, vault, key)

  return { success: true, data: { title: entry.title } }
}
