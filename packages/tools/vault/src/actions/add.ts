import { randomUUID } from 'node:crypto'
import type { ToolContext, ToolResult } from '@mirror/core'
import { writeVault } from '../vault-file.js'
import { loadVaultSession, findActiveEntry } from '../vault-helpers.js'
import type { Entry } from '../types.js'
import type { VaultInput } from '../schema.js'

type AddInput = Extract<VaultInput, { action: 'add' }>

export async function add(input: AddInput, _ctx: ToolContext): Promise<ToolResult<{ id: string }>> {
  const loaded = await loadVaultSession()
  if (!loaded.success) return loaded

  const { session, key, vault } = loaded.data

  if (findActiveEntry(vault.entries, input.title)) {
    return {
      success: false,
      error: { code: 'EXECUTION_ERROR', message: `Entry "${input.title}" already exists` },
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
}
