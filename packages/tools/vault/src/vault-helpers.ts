import type { ToolResult } from '@mirror/core'
import type { Entry, VaultData } from './types.js'
import { loadSession } from './session.js'
import { readVault } from './vault-file.js'

export type LoadedVault = {
  session: Awaited<ReturnType<typeof loadSession>> & object
  key: Buffer
  vault: VaultData
}

export async function loadVaultSession(): Promise<ToolResult<LoadedVault>> {
  const session = await loadSession()
  if (!session) {
    return { success: false, error: { code: 'UNAUTHORIZED', message: 'Vault is locked' } }
  }
  const key = Buffer.from(session.key, 'base64')
  const vault = await readVault(session.vaultPath, key)
  return { success: true, data: { session, key, vault } }
}

export function findActiveEntry(entries: Entry[], title: string): Entry | undefined {
  const lower = title.toLowerCase()
  return entries.find((e) => e.title.toLowerCase() === lower && !e.deleted_at)
}

export function findActiveEntryIndex(entries: Entry[], title: string): number {
  const lower = title.toLowerCase()
  return entries.findIndex((e) => e.title.toLowerCase() === lower && !e.deleted_at)
}
