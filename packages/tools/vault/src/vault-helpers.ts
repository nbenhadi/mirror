import type { ToolResult } from '@nbenhadi/mirror-core'
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
    return { success: false, error: { code: 'UNAUTHORIZED', message: 'tool.vault.error.locked' } }
  }
  const key = Buffer.from(session.key, 'base64')
  let vault: VaultData
  try {
    vault = await readVault(session.vaultPath, key)
  } catch {
    return {
      success: false,
      error: { code: 'CRYPTO_ERROR', message: 'tool.vault.error.vault_not_found' },
    }
  }
  return { success: true, data: { session, key, vault } }
}

export async function withVaultSession<T>(
  fn: (data: LoadedVault) => Promise<ToolResult<T>>
): Promise<ToolResult<T>> {
  const loaded = await loadVaultSession()
  if (!loaded.success) return loaded
  return fn(loaded.data)
}

export function findActiveEntry(entries: Entry[], title: string): Entry | undefined {
  const lower = title.toLowerCase()
  return entries.find((e) => e.title.toLowerCase() === lower && !e.deleted_at)
}

export function findActiveEntryIndex(entries: Entry[], title: string): number {
  const lower = title.toLowerCase()
  return entries.findIndex((e) => e.title.toLowerCase() === lower && !e.deleted_at)
}
