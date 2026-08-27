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

export function findCanonicalTagName(vault: VaultData, name: string): string | undefined {
  const lower = name.toLowerCase()
  const inRegistry = vault.tags.find((t) => t.toLowerCase() === lower)
  if (inRegistry) return inRegistry
  for (const entry of vault.entries) {
    const found = entry.tags.find((t) => t.toLowerCase() === lower)
    if (found) return found
  }
  return undefined
}

export type ResolveTagsResult = { success: true; tags: string[] } | { success: false; name: string }

export function resolveEntryTags(vault: VaultData, names: string[]): ResolveTagsResult {
  const resolved: string[] = []
  for (const raw of names) {
    const name = raw.trim()
    if (!name) continue
    const canonical = findCanonicalTagName(vault, name)
    if (canonical === undefined) return { success: false, name }
    if (!resolved.includes(canonical)) resolved.push(canonical)
  }
  return { success: true, tags: resolved }
}

export function allTagNames(vault: VaultData): string[] {
  const names = [...vault.tags]
  for (const entry of vault.entries) {
    for (const tag of entry.tags) {
      if (!names.some((n) => n.toLowerCase() === tag.toLowerCase())) names.push(tag)
    }
  }
  return names
}

export function countEntriesByTag(entries: Entry[], tagName: string): number {
  const lower = tagName.toLowerCase()
  return entries.filter((e) => !e.deleted_at && e.tags.some((t) => t.toLowerCase() === lower))
    .length
}
