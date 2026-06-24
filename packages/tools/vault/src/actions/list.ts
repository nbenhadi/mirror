import type { ToolContext, ToolResult } from '@nbenhadi/mirror-core'
import { withVaultSession } from '../vault-helpers.js'

type EntryPreview = {
  title: string
  username: string
  url: string
  tags: string[]
}

type ListInput = { action: 'list'; search?: string | undefined; tag?: string | undefined }

function globToRegex(pattern: string): RegExp {
  const escaped = pattern.replace(/[.+^${}()|[\]\\]/g, '\\$&').replace(/\*/g, '.*')
  return new RegExp(`^${escaped}$`, 'i')
}

function matchSearchPattern(pattern: string, fields: string[]): boolean {
  const alts = pattern
    .split('|')
    .map((s) => s.trim())
    .filter(Boolean)
  return alts.some((alt) => {
    if (alt.includes('*')) {
      const re = globToRegex(alt)
      return fields.some((f) => re.test(f))
    }
    return fields.some((f) => f.toLowerCase().includes(alt.toLowerCase()))
  })
}

function matchTagPattern(pattern: string, tags: string[]): boolean {
  const alts = pattern
    .split('|')
    .map((s) => s.trim())
    .filter(Boolean)
  return alts.some((alt) => {
    if (alt.includes('*')) {
      const re = globToRegex(alt)
      return tags.some((t) => re.test(t))
    }
    return tags.some((t) => t.toLowerCase() === alt.toLowerCase())
  })
}

export async function list(
  input: ListInput,
  _ctx: ToolContext
): Promise<ToolResult<{ entries: EntryPreview[]; count: number }>> {
  return withVaultSession(async ({ vault }) => {
    const search = input.search?.toLowerCase()
    const tag = input.tag

    const entries: EntryPreview[] = vault.entries
      .filter((e) => {
        if (e.deleted_at) return false
        if (tag && !matchTagPattern(tag, e.tags)) return false
        if (search) {
          const fields = [e.title, e.username ?? '', e.url ?? ''].filter(Boolean)
          if (!matchSearchPattern(search, fields)) return false
        }
        return true
      })
      .map((e) => ({
        title: e.title,
        username: e.username ?? '',
        url: e.url ?? '',
        tags: e.tags,
      }))

    return { success: true, data: { entries, count: entries.length } }
  })
}
