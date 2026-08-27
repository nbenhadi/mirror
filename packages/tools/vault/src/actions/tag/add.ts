import type { ToolContext, ToolResult } from '@nbenhadi/mirror-core'
import { writeVault } from '../../vault-file.js'
import { withVaultSession, findCanonicalTagName } from '../../vault-helpers.js'
import type { VaultInput } from '../../schema.js'

type TagAddInput = Extract<VaultInput, { action: 'tag.add' }>

export async function tagAdd(
  input: TagAddInput,
  _ctx: ToolContext
): Promise<ToolResult<{ name: string }>> {
  return withVaultSession(async ({ session, key, vault }) => {
    const name = input.name.trim()
    if (findCanonicalTagName(vault, name)) {
      return {
        success: false,
        error: {
          code: 'EXECUTION_ERROR',
          message: 'tool.vault.error.tag_exists',
          params: { name },
        },
      }
    }

    vault.tags.push(name)
    await writeVault(session.vaultPath, vault, key)

    return { success: true, data: { name } }
  })
}
