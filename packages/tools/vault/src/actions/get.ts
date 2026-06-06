import type { ToolContext, ToolResult } from '@mirror/core'
import { loadSession } from '../session.js'
import { readVault } from '../vault-file.js'

type GetInput = { action: 'get'; title: string; showPassword: boolean }

type EntryResult = {
  id: string
  title: string
  username?: string
  password?: string
  url?: string
  notes?: string
  tags: string[]
  created_at: string
  updated_at: string
}

export async function get(input: GetInput, _ctx: ToolContext): Promise<ToolResult<EntryResult>> {
  const session = await loadSession()
  if (!session) {
    return { success: false, error: { code: 'UNAUTHORIZED', message: 'Vault is locked' } }
  }

  const key = Buffer.from(session.key, 'base64')
  const vault = await readVault(session.vaultPath, key)

  const entry = vault.entries.find(
    (e) => e.title.toLowerCase() === input.title.toLowerCase() && !e.deleted_at
  )

  if (!entry) {
    return {
      success: false,
      error: { code: 'NOT_FOUND', message: `Entry "${input.title}" not found` },
    }
  }

  return {
    success: true,
    data: {
      id: entry.id,
      title: entry.title,
      tags: entry.tags,
      created_at: entry.created_at,
      updated_at: entry.updated_at,
      ...(entry.password !== undefined && {
        password: input.showPassword ? entry.password : '••••••••',
      }),
      ...(entry.username !== undefined && { username: entry.username }),
      ...(entry.url !== undefined && { url: entry.url }),
      ...(entry.notes !== undefined && { notes: entry.notes }),
    },
  }
}
