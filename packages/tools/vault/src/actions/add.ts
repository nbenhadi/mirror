import { randomUUID } from 'node:crypto'
import type { ToolContext, ToolResult } from '@mirror/core'
import { loadSession } from '../session.js'
import { readVault, writeVault } from '../vault-file.js'
import type { Entry } from '../types.js'
import type { VaultInput } from '../schema.js'

type AddInput = Extract<VaultInput, { action: 'add' }>

export async function add(input: AddInput, _ctx: ToolContext): Promise<ToolResult<{ id: string }>> {
  const session = await loadSession()
  if (!session) {
    return { success: false, error: { code: 'UNAUTHORIZED', message: 'Vault is locked' } }
  }

  const key = Buffer.from(session.key, 'base64')
  const vault = await readVault(session.vaultPath, key)

  const duplicate = vault.entries.find(
    (e) => e.title.toLowerCase() === input.title.toLowerCase() && !e.deleted_at
  )
  if (duplicate) {
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
