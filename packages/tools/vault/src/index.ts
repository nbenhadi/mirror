import type { Tool } from '@nbenhadi/mirror-core'
import { t } from '@nbenhadi/mirror-i18n'
import { schema } from './schema.js'
import { execute } from './execute.js'
import { loadConfig } from './config.js'
import { loadSession } from './session.js'
import type { VaultInput } from './schema.js'

export const VAULT_TOOL_ID = 'vault' as const

export const vaultTool: Tool<VaultInput, unknown> = {
  id: VAULT_TOOL_ID,
  description: t('cmd.vault.description'),
  schema,
  execute,
}

export type VaultStatus = 'no-vault' | 'locked' | 'unlocked'

export async function getVaultStatus(): Promise<VaultStatus> {
  const config = await loadConfig()
  if (!config.vault) return 'no-vault'
  const session = await loadSession()
  return session !== null ? 'unlocked' : 'locked'
}

export type { VaultInput } from './schema.js'
export type { Entry, VaultData, VaultConfig, MirrorConfig, SessionData } from './types.js'
