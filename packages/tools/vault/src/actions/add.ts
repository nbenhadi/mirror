import { randomUUID } from 'node:crypto'
import type { ToolContext, ToolResult } from '@nbenhadi/mirror-core'
import { writeVault } from '../vault-file.js'
import { withVaultSession, findActiveEntry } from '../vault-helpers.js'
import type { Entry } from '../types.js'
import type { VaultInput } from '../schema.js'

type AddInput = Extract<VaultInput, { action: 'add' }>

export async function add(input: AddInput, _ctx: ToolContext): Promise<ToolResult<{ id: string }>> {
  return withVaultSession(async ({ session, key, vault }) => {
    if (findActiveEntry(vault.entries, input.title)) {
      return {
        success: false,
        error: {
          code: 'EXECUTION_ERROR',
          message: 'tool.vault.error.entry_exists',
          params: { title: input.title },
        },
      }
    }

    const now = new Date().toISOString()
    const entry: Entry = {
      id: randomUUID(),
      title: input.title,
      tags: input.tags,
      created_at: now,
      updated_at: now,
      ...(input.password !== undefined && { password: input.password }),
      ...(input.username !== undefined && { username: input.username }),
      ...(input.url !== undefined && { url: input.url }),
      ...(input.notes !== undefined && { notes: input.notes }),
    }

    vault.entries.push(entry)
    await writeVault(session.vaultPath, vault, key)

    return { success: true, data: { id: entry.id } }
  })
}
