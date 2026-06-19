import type { ToolContext, ToolResult } from '@nbenhadi/mirror-core'
import { loadSession } from '../session.js'
import { readVault, writeVault } from '../vault-file.js'

type PurgeInput = { action: 'purge'; title?: string | undefined }
type PurgeResult = { title: string; count?: never } | { count: number; title?: never }

export async function purge(
  input: PurgeInput,
  _ctx: ToolContext
): Promise<ToolResult<PurgeResult>> {
  const session = await loadSession()
  if (!session) {
    return { success: false, error: { code: 'UNAUTHORIZED', message: 'Vault is locked' } }
  }

  const key = Buffer.from(session.key, 'base64')
  const vault = await readVault(session.vaultPath, key)

  if (input.title === undefined) {
    const before = vault.entries.length
    vault.entries = vault.entries.filter((e) => e.deleted_at === undefined)
    const count = before - vault.entries.length
    if (count > 0) await writeVault(session.vaultPath, vault, key)
    return { success: true, data: { count } }
  }

  const idx = vault.entries.findIndex(
    (e) => e.title.toLowerCase() === input.title!.toLowerCase() && e.deleted_at !== undefined
  )

  if (idx === -1) {
    return {
      success: false,
      error: { code: 'NOT_FOUND', message: `"${input.title}" not found in trash` },
    }
  }

  const removed = vault.entries.splice(idx, 1)[0]!
  await writeVault(session.vaultPath, vault, key)

  return { success: true, data: { title: removed.title } }
}
