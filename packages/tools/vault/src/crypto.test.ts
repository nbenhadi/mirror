import { describe, it, expect } from 'vitest'
import { encryptBuffer, decryptBuffer, generateSalt } from './crypto.js'

const KEY = Buffer.alloc(32)

describe('encryptBuffer / decryptBuffer', () => {
  it('roundtrips plaintext', () => {
    const plain = 'hello world'
    expect(decryptBuffer(encryptBuffer(plain, KEY), KEY)).toBe(plain)
  })

  it('roundtrips empty string', () => {
    expect(decryptBuffer(encryptBuffer('', KEY), KEY)).toBe('')
  })

  it('roundtrips unicode', () => {
    const plain = 'contraseña segura 🔑'
    expect(decryptBuffer(encryptBuffer(plain, KEY), KEY)).toBe(plain)
  })

  it('throws on data too short', () => {
    expect(() => decryptBuffer(Buffer.alloc(10), KEY)).toThrow('Invalid encrypted data')
  })

  it('throws on tampered auth tag', () => {
    const enc = Buffer.from(encryptBuffer('secret', KEY))
    enc[15] ^= 0xff
    expect(() => decryptBuffer(enc, KEY)).toThrow()
  })

  it('produces different ciphertext each call', () => {
    const a = encryptBuffer('same', KEY)
    const b = encryptBuffer('same', KEY)
    expect(a.equals(b)).toBe(false)
  })
})

describe('generateSalt', () => {
  it('returns 32 bytes', () => {
    expect(generateSalt()).toHaveLength(32)
  })

  it('returns different values each call', () => {
    expect(generateSalt().equals(generateSalt())).toBe(false)
  })
})
