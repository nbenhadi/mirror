import type { ToolContext, ToolResult } from '@nbenhadi/mirror-core'
import { loadVaultSession, findActiveEntry } from '../vault-helpers.js'

type GetInput = { action: 'get'; title: string; showPassword: boolean }

type EntryResult = {
  title: string
  username?: string
  tags: string[]
  url?: string
  notes?: string
  created_at: string
  updated_at: string
}

export async function get(input: GetInput, _ctx: ToolContext): Promise<ToolResult<EntryResult>> {
  const loaded = await loadVaultSession()
  if (!loaded.success) return loaded

  const { vault } = loaded.data
  const entry = findActiveEntry(vault.entries, input.title)

  if (!entry) {
    return {
      success: false,
      error: { code: 'NOT_FOUND', message: `Entry "${input.title}" not found` },
    }
  }

  return {
    success: true,
    data: {
      title: entry.title,
      ...(entry.username !== undefined && { username: entry.username }),
      tags: entry.tags,
      ...(entry.url !== undefined && { url: entry.url }),
      ...(entry.notes !== undefined && { notes: entry.notes }),
      ...(entry.password !== undefined && {
        password: input.showPassword ? entry.password : '••••••••',
      }),
      created_at: entry.created_at,
      updated_at: entry.updated_at,
    },
  }
}
