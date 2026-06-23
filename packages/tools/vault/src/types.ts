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

export interface KdfParams {
  memoryCost: number
  timeCost: number
  parallelism: number
}

export interface VaultConfig {
  path: string
}

export interface MirrorConfig {
  vault?: VaultConfig
}

export interface SessionData {
  key: string
  expiry: number
  vaultPath: string
}
