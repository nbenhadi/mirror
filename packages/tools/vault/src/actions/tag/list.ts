import type { ToolContext, ToolResult } from '@nbenhadi/mirror-core'
import { withVaultSession, allTagNames, countEntriesByTag } from '../../vault-helpers.js'

type TagListInput = { action: 'tag.list' }

type TagInfo = { name: string; count: number }

export async function tagList(
  _input: TagListInput,
  _ctx: ToolContext
): Promise<ToolResult<{ tags: TagInfo[]; count: number }>> {
  return withVaultSession(async ({ vault }) => {
    const tags = allTagNames(vault)
      .map((name) => ({ name, count: countEntriesByTag(vault.entries, name) }))
      .sort((a, b) => a.name.localeCompare(b.name))

    return { success: true, data: { tags, count: tags.length } }
  })
}
