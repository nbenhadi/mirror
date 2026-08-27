import type { ToolContext, ToolResult } from '@nbenhadi/mirror-core'
import { writeVault } from '../../vault-file.js'
import { withVaultSession, findCanonicalTagName } from '../../vault-helpers.js'
import type { VaultInput } from '../../schema.js'

type TagDeleteInput = Extract<VaultInput, { action: 'tag.delete' }>

export async function tagDelete(
  input: TagDeleteInput,
  _ctx: ToolContext
): Promise<ToolResult<{ name: string; entriesUpdated: number }>> {
  return withVaultSession(async ({ session, key, vault }) => {
    const current = findCanonicalTagName(vault, input.name)
    if (!current) {
      return {
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: 'tool.vault.error.tag_not_found',
          params: { name: input.name },
        },
      }
    }

    vault.tags = vault.tags.filter((t) => t.toLowerCase() !== current.toLowerCase())

    let entriesUpdated = 0
    const now = new Date().toISOString()
    for (const entry of vault.entries) {
      const hasCurrent = entry.tags.some((t) => t.toLowerCase() === current.toLowerCase())
      if (!hasCurrent) continue

      entry.tags = entry.tags.filter((t) => t.toLowerCase() !== current.toLowerCase())
      entry.updated_at = now
      entriesUpdated++
    }

    await writeVault(session.vaultPath, vault, key)

    return { success: true, data: { name: current, entriesUpdated } }
  })
}
