import { readConfig, patchConfig } from '@nbenhadi/mirror-config'
import type { MirrorConfig } from './types.js'

export async function loadConfig(): Promise<MirrorConfig> {
  const config = await readConfig()
  const vault = config.tools?.vault
  if (vault?.path) {
    return {
      vault: {
        path: vault.path,
        ...(vault.salt !== undefined && { salt: vault.salt }),
        ...(vault.kdf !== undefined && { kdf: vault.kdf }),
      },
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
