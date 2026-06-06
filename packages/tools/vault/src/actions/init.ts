import { existsSync } from 'node:fs'
import { homedir } from 'node:os'
import { join } from 'node:path'
import type { ToolContext, ToolResult } from '@mirror/core'
import { deriveKey, generateSalt, DEFAULT_KDF } from '../crypto.js'
import { loadConfig, saveConfig } from '../config.js'
import { writeVault } from '../vault-file.js'
import type { VaultData } from '../types.js'
import type { VaultInput } from '../schema.js'

type InitInput = Extract<VaultInput, { action: 'init' }>

const DEFAULT_VAULT_PATH = join(homedir(), '.local', 'share', 'mirror', 'vault.vault')

export async function init(
  input: InitInput,
  _ctx: ToolContext
): Promise<ToolResult<{ path: string }>> {
  const config = await loadConfig()

  if (config.vault) {
    return {
      success: false,
      error: {
        code: 'EXECUTION_ERROR',
        message: 'Vault already initialized. Use `mirror vault path` to see its location.',
      },
    }
  }

  const vaultPath = input.path ?? DEFAULT_VAULT_PATH

  if (existsSync(vaultPath)) {
    return {
      success: false,
      error: { code: 'EXECUTION_ERROR', message: `File already exists at ${vaultPath}` },
    }
  }

  const salt = generateSalt()
  const key = await deriveKey(input.masterPassword, salt, DEFAULT_KDF)

  const vaultData: VaultData = {
    version: 1,
    entries: [],
    created_at: new Date().toISOString(),
  }

  await writeVault(vaultPath, vaultData, key)
  await saveConfig({
    ...config,
    vault: {
      path: vaultPath,
      salt: salt.toString('base64'),
      kdf: DEFAULT_KDF,
    },
  })

  return { success: true, data: { path: vaultPath } }
}
