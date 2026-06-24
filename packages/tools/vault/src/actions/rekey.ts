import type { ToolContext, ToolResult } from '@nbenhadi/mirror-core'
import { loadSession, clearSession } from '../session.js'
import { loadConfig, saveConfig } from '../config.js'
import { readVault, writeVault } from '../vault-file.js'
import { deriveKey, generateSalt, DEFAULT_KDF } from '../crypto.js'

type RekeyInput = { action: 'rekey'; currentPassword: string; newPassword: string }

export async function rekey(
  input: RekeyInput,
  _ctx: ToolContext
): Promise<ToolResult<{ message: string }>> {
  const session = await loadSession()
  if (!session) {
    return { success: false, error: { code: 'UNAUTHORIZED', message: 'Vault is locked' } }
  }

  const config = await loadConfig()
  if (!config.vault) {
    return { success: false, error: { code: 'NOT_FOUND', message: 'No vault initialized' } }
  }

  const currentKey = Buffer.from(session.key, 'base64')
  const vault = await readVault(config.vault.path, currentKey)

  let derivedKey: Buffer
  try {
    derivedKey = await deriveKey(
      input.currentPassword,
      Buffer.from(vault.salt, 'base64'),
      vault.kdf
    )
  } catch {
    return { success: false, error: { code: 'EXECUTION_ERROR', message: 'Failed to derive key' } }
  }

  if (derivedKey.toString('base64') !== session.key) {
    return {
      success: false,
      error: { code: 'UNAUTHORIZED', message: 'Current password is incorrect' },
    }
  }

  const newSalt = generateSalt()
  const newKey = await deriveKey(input.newPassword, newSalt, DEFAULT_KDF)

  const updatedVault = { ...vault, salt: newSalt.toString('base64'), kdf: DEFAULT_KDF }
  await writeVault(config.vault.path, updatedVault, newKey)

  await saveConfig({ vault: { ...config.vault, salt: newSalt.toString('base64') } })

  await clearSession()

  return {
    success: true,
    data: { message: 'Master password changed. Vault locked. Unlock with your new password.' },
  }
}
