import { readFile, writeFile, mkdir, chmod } from 'node:fs/promises'
import { existsSync } from 'node:fs'
import { dirname } from 'node:path'
import { encryptBuffer, decryptBuffer } from './crypto.js'
import type { VaultData, KdfParams } from './types.js'

const MAGIC = Buffer.from([0x4d, 0x52, 0x56, 0x02])
const HEADER_SIZE = 48

function writeBinary(data: VaultData, key: Buffer): Buffer {
  const { salt, kdf, ...payload } = data
  const saltBuf = Buffer.from(salt, 'base64')
  const encrypted = encryptBuffer(JSON.stringify(payload), key)

  const header = Buffer.allocUnsafe(HEADER_SIZE)
  MAGIC.copy(header, 0)
  saltBuf.copy(header, 4)
  header.writeUInt32BE(kdf.memoryCost, 36)
  header.writeUInt32BE(kdf.timeCost, 40)
  header.writeUInt32BE(kdf.parallelism, 44)

  return Buffer.concat([header, encrypted])
}

function readBinary(buf: Buffer, key: Buffer): VaultData {
  const saltBuf = buf.subarray(4, 36)
  const salt = saltBuf.toString('base64')
  const kdf: KdfParams = {
    memoryCost: buf.readUInt32BE(36),
    timeCost: buf.readUInt32BE(40),
    parallelism: buf.readUInt32BE(44),
  }
  const decrypted = decryptBuffer(buf.subarray(HEADER_SIZE), key)
  const payload = JSON.parse(decrypted) as Omit<VaultData, 'salt' | 'kdf'>
  return { ...payload, salt, kdf }
}

export async function readVault(path: string, key: Buffer): Promise<VaultData> {
  const buf = await readFile(path)
  return readBinary(buf, key)
}

export async function getVaultSaltAndKdf(path: string): Promise<{ salt: Buffer; kdf: KdfParams }> {
  const buf = await readFile(path)
  return {
    salt: buf.subarray(4, 36),
    kdf: {
      memoryCost: buf.readUInt32BE(36),
      timeCost: buf.readUInt32BE(40),
      parallelism: buf.readUInt32BE(44),
    },
  }
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
  const binary = writeBinary(data, key)
  await writeFile(path, binary, { mode: 0o600, ...(flag && { flag }) })
  await chmod(path, 0o600)
}
