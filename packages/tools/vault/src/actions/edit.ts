import type { ToolContext, ToolResult } from '@mirror/core'
import { loadSession } from '../session.js'
import { readVault, writeVault } from '../vault-file.js'
import type { VaultInput } from '../schema.js'

type EditInput = Extract<VaultInput, { action: 'edit' }>

export async function edit(
  input: EditInput,
  _ctx: ToolContext
): Promise<ToolResult<{ title: string }>> {
  const session = await loadSession()
  if (!session) {
    return { success: false, error: { code: 'UNAUTHORIZED', message: 'Vault is locked' } }
  }

  const key = Buffer.from(session.key, 'base64')
  const vault = await readVault(session.vaultPath, key)

  const entry = vault.entries.find(
    (e) => e.title.toLowerCase() === input.title.toLowerCase() && !e.deleted_at
  )

  if (!entry) {
    return {
      success: false,
      error: { code: 'NOT_FOUND', message: `Entry "${input.title}" not found` },
    }
  }

  if (input.newTitle !== undefined) {
    const conflict = vault.entries.find(
      (e) =>
        e.id !== entry.id &&
        e.title.toLowerCase() === input.newTitle!.toLowerCase() &&
        !e.deleted_at
    )
    if (conflict) {
      return {
        success: false,
        error: { code: 'EXECUTION_ERROR', message: `Entry "${input.newTitle}" already exists` },
      }
    }
    entry.title = input.newTitle
  }

  if (input.username !== undefined) entry.username = input.username
  if (input.password !== undefined) entry.password = input.password
  if (input.url !== undefined) entry.url = input.url
  if (input.notes !== undefined) entry.notes = input.notes
  if (input.tags !== undefined) entry.tags = input.tags

  entry.updated_at = new Date().toISOString()
  await writeVault(session.vaultPath, vault, key)

  return { success: true, data: { title: entry.title } }
}
