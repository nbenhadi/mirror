import { join, dirname, resolve as resolvePath } from 'node:path'
import type { ToolContext, ToolResult } from '@nbenhadi/mirror-core'
import { getUserDataDir } from '@nbenhadi/mirror-config'
import { deriveKey, generateSalt, DEFAULT_KDF } from '../crypto.js'
import { loadConfig, saveConfig } from '../config.js'
import { writeVault } from '../vault-file.js'
import type { VaultData } from '../types.js'
import type { VaultInput } from '../schema.js'

type InitInput = Extract<VaultInput, { action: 'init' }>

const DEFAULT_VAULT_FILE = join(getUserDataDir(), 'vault.vault')

export async function init(
  input: InitInput,
  _ctx: ToolContext
): Promise<ToolResult<{ path: string }>> {
  const config = await loadConfig()

  if (config.vault) {
    return {
      success: false,
      error: { code: 'EXECUTION_ERROR', message: 'tool.vault.error.already_initialized' },
    }
  }

  const vaultPath = resolvePath(input.path ?? DEFAULT_VAULT_FILE)
  const vaultDir = dirname(vaultPath)

  const salt = generateSalt()
  const key = await deriveKey(input.masterPassword, salt, DEFAULT_KDF)

  const vaultData: VaultData = {
    version: 1,
    entries: [],
    created_at: new Date().toISOString(),
    salt: salt.toString('base64'),
    kdf: DEFAULT_KDF,
  }

  try {
    await writeVault(vaultPath, vaultData, key, 'wx')
  } catch (err) {
    if ((err as NodeJS.ErrnoException).code === 'EEXIST') {
      return {
        success: false,
        error: {
          code: 'EXECUTION_ERROR',
          message: 'tool.vault.error.file_exists',
          params: { path: vaultPath },
        },
      }
    }
    return {
      success: false,
      error: { code: 'EXECUTION_ERROR', message: 'tool.vault.error.init_failed' },
    }
  }
  await saveConfig({
    ...config,
    vault: {
      path: vaultDir,
    },
  })

  return { success: true, data: { path: vaultPath } }
}
