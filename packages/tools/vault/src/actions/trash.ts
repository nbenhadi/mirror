import type { ToolContext, ToolResult } from '@nbenhadi/mirror-core'
import { loadSession } from '../session.js'
import { readVault } from '../vault-file.js'

type TrashedEntry = {
  id: string
  title: string
  username?: string
  deleted_at: string
}

export async function trash(
  _input: { action: 'trash' },
  _ctx: ToolContext
): Promise<ToolResult<{ entries: TrashedEntry[]; count: number }>> {
  const session = await loadSession()
  if (!session) {
    return { success: false, error: { code: 'UNAUTHORIZED', message: 'Vault is locked' } }
  }

  const key = Buffer.from(session.key, 'base64')
  const vault = await readVault(session.vaultPath, key)

  const entries: TrashedEntry[] = vault.entries
    .filter((e): e is typeof e & { deleted_at: string } => e.deleted_at !== undefined)
    .map((e) => ({
      id: e.id,
      title: e.title,
      deleted_at: e.deleted_at,
      ...(e.username !== undefined && { username: e.username }),
    }))

  return { success: true, data: { entries, count: entries.length } }
}
