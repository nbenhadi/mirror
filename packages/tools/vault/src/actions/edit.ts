import type { ToolContext, ToolResult } from '@nbenhadi/mirror-core'
import { writeVault } from '../vault-file.js'
import { withVaultSession, findActiveEntry } from '../vault-helpers.js'
import type { VaultInput } from '../schema.js'

type EditInput = Extract<VaultInput, { action: 'edit' }>

export async function edit(
  input: EditInput,
  _ctx: ToolContext
): Promise<ToolResult<{ title: string }>> {
  return withVaultSession(async ({ session, key, vault }) => {
    const entry = findActiveEntry(vault.entries, input.title)

    if (!entry) {
      return {
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: 'tool.vault.error.entry_not_found',
          params: { title: input.title },
        },
      }
    }

    if (input.newTitle !== undefined) {
      const newTitle = input.newTitle
      const conflict = vault.entries.find(
        (e) =>
          e.id !== entry.id && e.title.toLowerCase() === newTitle.toLowerCase() && !e.deleted_at
      )
      if (conflict) {
        return {
          success: false,
          error: {
            code: 'EXECUTION_ERROR',
            message: 'tool.vault.error.entry_exists',
            params: { title: newTitle },
          },
        }
      }
      entry.title = newTitle
    }

    if (input.username !== undefined) entry.username = input.username
    if (input.password !== undefined) entry.password = input.password
    if (input.url !== undefined) entry.url = input.url
    if (input.notes !== undefined) entry.notes = input.notes
    if (input.tags !== undefined) entry.tags = input.tags

    entry.updated_at = new Date().toISOString()
    await writeVault(session.vaultPath, vault, key)

    return { success: true, data: { title: entry.title } }
  })
}
