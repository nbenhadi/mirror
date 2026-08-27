import type { ToolContext, ToolResult } from '@nbenhadi/mirror-core'
import { writeVault } from '../../vault-file.js'
import { withVaultSession, findCanonicalTagName } from '../../vault-helpers.js'
import type { VaultInput } from '../../schema.js'

type TagEditInput = Extract<VaultInput, { action: 'tag.edit' }>

export async function tagEdit(
  input: TagEditInput,
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

    const typedName = input.newName.trim()
    const existingTarget = findCanonicalTagName(vault, typedName)
    // Renaming onto a name that already identifies a different tag merges the two.
    const targetName =
      existingTarget && existingTarget.toLowerCase() !== current.toLowerCase()
        ? existingTarget
        : typedName

    vault.tags = vault.tags.filter((t) => t.toLowerCase() !== current.toLowerCase())
    if (!vault.tags.some((t) => t.toLowerCase() === targetName.toLowerCase())) {
      vault.tags.push(targetName)
    }

    let entriesUpdated = 0
    const now = new Date().toISOString()
    for (const entry of vault.entries) {
      const hasCurrent = entry.tags.some((t) => t.toLowerCase() === current.toLowerCase())
      if (!hasCurrent) continue

      const withoutCurrent = entry.tags.filter((t) => t.toLowerCase() !== current.toLowerCase())
      entry.tags = withoutCurrent.some((t) => t.toLowerCase() === targetName.toLowerCase())
        ? withoutCurrent
        : [...withoutCurrent, targetName]
      entry.updated_at = now
      entriesUpdated++
    }

    await writeVault(session.vaultPath, vault, key)

    return { success: true, data: { name: targetName, entriesUpdated } }
  })
}
