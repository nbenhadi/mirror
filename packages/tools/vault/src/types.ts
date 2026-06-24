import type { KdfParams, VaultConfig } from '@nbenhadi/mirror-config'

export type { KdfParams, VaultConfig }

export interface Entry {
  id: string
  title: string
  username?: string
  password?: string
  url?: string
  notes?: string
  tags: string[]
  created_at: string
  updated_at: string
  deleted_at?: string
}

export interface VaultData {
  version: number
  entries: Entry[]
  created_at: string
  salt: string
  kdf: KdfParams
}

export interface MirrorConfig {
  vault?: VaultConfig
}

export interface SessionData {
  key: string
  expiry: number
  vaultPath: string
}
