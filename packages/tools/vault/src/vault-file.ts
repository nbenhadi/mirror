import { readFile, writeFile, mkdir, chmod } from 'node:fs/promises'
import { existsSync } from 'node:fs'
import { dirname } from 'node:path'
import { encryptBuffer, decryptBuffer } from './crypto.js'
import type { VaultData } from './types.js'

export async function readVault(path: string, key: Buffer): Promise<VaultData> {
  const raw = await readFile(path)
  const decrypted = decryptBuffer(raw, key)
  return JSON.parse(decrypted) as VaultData
}

export async function writeVault(
  path: string,
  data: VaultData,
  key: Buffer,
  flag?: string
): Promise<void> {
  const dir = dirname(path)
  if (!existsSync(dir)) {
    await mkdir(dir, { recursive: true })
  }
  const encrypted = encryptBuffer(JSON.stringify(data), key)
  await writeFile(path, encrypted, { mode: 0o600, ...(flag && { flag }) })
  await chmod(path, 0o600)
}
