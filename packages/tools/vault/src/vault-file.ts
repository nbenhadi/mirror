import { readFile, writeFile, mkdir, chmod } from 'node:fs/promises'
import { existsSync } from 'node:fs'
import { dirname } from 'node:path'
import { encryptBuffer, decryptBuffer } from './crypto.js'
import type { VaultData, KdfParams } from './types.js'

interface VaultFile {
  salt: string
  kdf: KdfParams
  data: string
}

export async function readVault(path: string, key: Buffer): Promise<VaultData> {
  const raw = await readFile(path, 'utf8')
  const vaultFile = JSON.parse(raw) as VaultFile
  const decrypted = decryptBuffer(Buffer.from(vaultFile.data, 'base64'), key)
  const data = JSON.parse(decrypted) as Omit<VaultData, 'salt' | 'kdf'>
  return { ...data, salt: vaultFile.salt, kdf: vaultFile.kdf }
}

export async function getVaultSaltAndKdf(path: string): Promise<{ salt: Buffer; kdf: KdfParams }> {
  const raw = await readFile(path, 'utf8')
  const vaultFile = JSON.parse(raw) as VaultFile
  return { salt: Buffer.from(vaultFile.salt, 'base64'), kdf: vaultFile.kdf }
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
  const { salt, kdf, ...vaultDataWithoutSaltKdf } = data
  const encrypted = encryptBuffer(JSON.stringify(vaultDataWithoutSaltKdf), key)
  const vaultFile: VaultFile = {
    salt,
    kdf,
    data: encrypted.toString('base64'),
  }
  await writeFile(path, JSON.stringify(vaultFile, null, 2), { mode: 0o600, ...(flag && { flag }) })
  await chmod(path, 0o600)
}
