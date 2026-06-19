import type { Tool } from '@nbenhadi/mirror-core'
import { schema } from './schema.js'
import { execute } from './execute.js'
import type { VaultInput } from './schema.js'

export const vaultTool: Tool<VaultInput, unknown> = {
  id: 'vault',
  description: 'Encrypted local vault for storing sensitive entries',
  schema,
  execute,
}

export type { VaultInput } from './schema.js'
export type { Entry, VaultData, VaultConfig, MirrorConfig, SessionData } from './types.js'
