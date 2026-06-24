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
      error: { code: 'NOT_FOUND', message: 'tool.vault.error.not_initialized' },
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
      error: { code: 'NOT_FOUND', message: 'tool.vault.error.vault_not_found' },
    }
  }

  let key: Buffer

  try {
    key = await deriveKey(input.masterPassword, salt, kdf)
  } catch {
    return {
      success: false,
      error: { code: 'EXECUTION_ERROR', message: 'tool.vault.error.derive_failed' },
    }
  }

  try {
    await readVault(config.vault.path, key)
  } catch {
    return {
      success: false,
      error: { code: 'UNAUTHORIZED', message: 'tool.vault.error.invalid_password' },
    }
  }

  const expiry = Date.now() + input.minutes * 60 * 1000
  await saveSession({ key: key.toString('base64'), expiry, vaultPath: config.vault.path })

  return { success: true, data: { expiresAt: new Date(expiry).toISOString() } }
}
