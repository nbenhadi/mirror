import { hash } from 'argon2'
import { createCipheriv, createDecipheriv, randomBytes } from 'node:crypto'
import type { KdfParams } from './types.js'

export const DEFAULT_KDF: KdfParams = {
  memoryCost: 65536,
  timeCost: 3,
  parallelism: 4,
}

export async function deriveKey(password: string, salt: Buffer, kdf: KdfParams): Promise<Buffer> {
  return hash(password, {
    type: 2,
    salt,
    memoryCost: kdf.memoryCost,
    timeCost: kdf.timeCost,
    parallelism: kdf.parallelism,
    hashLength: 32,
    raw: true,
  }) as Promise<Buffer>
}

export function encryptBuffer(plaintext: string, key: Buffer): Buffer {
  const iv = randomBytes(12)
  const cipher = createCipheriv('aes-256-gcm', key, iv)
  const ciphertext = Buffer.concat([cipher.update(plaintext, 'utf8'), cipher.final()])
  const tag = cipher.getAuthTag()
  return Buffer.concat([iv, tag, ciphertext])
}

export function decryptBuffer(data: Buffer, key: Buffer): string {
  if (data.length < 28) throw new Error('Invalid encrypted data')
  const iv = data.subarray(0, 12)
  const tag = data.subarray(12, 28)
  const ciphertext = data.subarray(28)
  const decipher = createDecipheriv('aes-256-gcm', key, iv)
  decipher.setAuthTag(tag)
  return Buffer.concat([decipher.update(ciphertext), decipher.final()]).toString('utf8')
}

export function generateSalt(): Buffer {
  return randomBytes(32)
}
