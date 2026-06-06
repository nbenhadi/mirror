import type { ToolContext, ToolResult } from '@mirror/core'
import { loadSession } from '../session.js'
import { readVault } from '../vault-file.js'

type EntryPreview = {
  id: string
  title: string
  username?: string
  url?: string
  tags: string[]
}

type ListInput = { action: 'list'; search?: string | undefined; tag?: string | undefined }

export async function list(
  input: ListInput,
  _ctx: ToolContext
): Promise<ToolResult<{ entries: EntryPreview[]; count: number }>> {
  const session = await loadSession()
  if (!session) {
    return { success: false, error: { code: 'UNAUTHORIZED', message: 'Vault is locked' } }
  }

  const key = Buffer.from(session.key, 'base64')
  const vault = await readVault(session.vaultPath, key)

  const search = input.search?.toLowerCase()
  const tag = input.tag?.toLowerCase()

  const entries: EntryPreview[] = vault.entries
    .filter((e) => {
      if (e.deleted_at) return false
      if (tag && !e.tags.some((t) => t.toLowerCase() === tag)) return false
      if (search) {
        const haystack = [e.title, e.username ?? '', e.url ?? ''].join(' ').toLowerCase()
        if (!haystack.includes(search)) return false
      }
      return true
    })
    .map((e) => ({
      id: e.id,
      title: e.title,
      tags: e.tags,
      ...(e.username !== undefined && { username: e.username }),
      ...(e.url !== undefined && { url: e.url }),
    }))

  return { success: true, data: { entries, count: entries.length } }
}
