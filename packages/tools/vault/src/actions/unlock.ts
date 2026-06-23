import type { ToolContext, ToolResult } from '@nbenhadi/mirror-core'
import { deriveKey } from '../crypto.js'
import { loadConfig } from '../config.js'
import { readVault, getVaultSaltAndKdf } from '../vault-file.js'
import { saveSession } from '../session.js'
import type { KdfParams } from '../types.js'

type UnlockInput = { action: 'unlock'; masterPassword: string; minutes: number }

export async function unlock(
  input: UnlockInput,
  _ctx: ToolContext
): Promise<ToolResult<{ expiresAt: string }>> {
  const config = await loadConfig()

  if (!config.vault) {
    return {
      success: false,
      error: { code: 'NOT_FOUND', message: 'No vault initialized. Run `mirror vault init` first.' },
    }
  }

  let salt: Buffer
  let kdf: KdfParams

  try {
    const vaultSaltAndKdf = await getVaultSaltAndKdf(config.vault.path)
    salt = vaultSaltAndKdf.salt
    kdf = vaultSaltAndKdf.kdf
  } catch {
    return {
      success: false,
      error: { code: 'NOT_FOUND', message: 'Vault file not found or corrupted' },
    }
  }

  let key: Buffer

  try {
    key = await deriveKey(input.masterPassword, salt, kdf)
  } catch {
    return {
      success: false,
      error: { code: 'EXECUTION_ERROR', message: 'Failed to derive key' },
    }
  }

  try {
    await readVault(config.vault.path, key)
  } catch {
    return {
      success: false,
      error: { code: 'UNAUTHORIZED', message: 'Invalid master password' },
    }
  }

  const expiry = Date.now() + input.minutes * 60 * 1000
  await saveSession({ key: key.toString('base64'), expiry, vaultPath: config.vault.path })

  return { success: true, data: { expiresAt: new Date(expiry).toISOString() } }
}
