import { readdirSync, statSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { readConfig, patchConfig } from '@nbenhadi/mirror-config'
import type { MirrorConfig } from './types.js'

function findVaultFile(storedPath: string): string | null {
  try {
    const stat = statSync(storedPath)
    if (stat.isFile()) return storedPath
    const files = readdirSync(storedPath)
      .filter((f) => f.endsWith('.vault'))
      .sort()
    return files.length > 0 ? join(storedPath, files[0]!) : null
  } catch {
    return null
  }
}

export function vaultDirFromPath(filePath: string): string {
  try {
    const stat = statSync(filePath)
    return stat.isFile() ? dirname(filePath) : filePath
  } catch {
    return dirname(filePath)
  }
}

export async function loadConfig(): Promise<MirrorConfig> {
  const config = await readConfig()
  const vault = config.tools?.vault
  if (vault?.path) {
    const vaultFile = findVaultFile(vault.path)
    if (vaultFile) {
      return {
        vault: {
          path: vaultFile,
          ...(vault.salt !== undefined && { salt: vault.salt }),
          ...(vault.kdf !== undefined && { kdf: vault.kdf }),
        },
      }
    }
  }
  return {}
}

export async function saveConfig(config: MirrorConfig): Promise<void> {
  if (!config.vault) return
  const patch: Record<string, unknown> = {}
  if (config.vault.path) patch['path'] = config.vault.path
  if (config.vault.salt !== undefined) patch['salt'] = config.vault.salt
  if (config.vault.kdf !== undefined) patch['kdf'] = config.vault.kdf
  await patchConfig({ tools: { vault: patch } })
}
