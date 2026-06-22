import { describe, it, expect } from 'vitest'
import { buildContext } from '@nbenhadi/mirror-core'
import { passphrase } from './passphrase.js'
import type { PassphraseInput } from '../schema.js'
import { WORDLIST } from '../wordlist.js'

const ctx = buildContext()

const run = (opts: Partial<PassphraseInput> = {}) =>
  passphrase(
    { action: 'passphrase', words: 6, separator: '-', capitalize: false, number: false, ...opts },
    ctx
  )

describe('passphrase', () => {
  it('produces the requested number of words', async () => {
    const r = await run({ words: 5 })
    expect(r.success).toBe(true)
    if (r.success) {
      expect(r.data.passphrase.split('-')).toHaveLength(5)
      expect(r.data.words).toBe(5)
    }
  })

  it('uses the custom separator', async () => {
    const r = await run({ words: 4, separator: '.' })
    if (r.success) expect(r.data.passphrase.split('.')).toHaveLength(4)
  })

  it('draws only from the wordlist', async () => {
    const r = await run({ words: 6 })
    if (r.success) {
      for (const word of r.data.passphrase.split('-')) {
        expect(WORDLIST).toContain(word)
      }
    }
  })

  it('capitalizes each word when enabled', async () => {
    const r = await run({ words: 4, capitalize: true })
    if (r.success) {
      for (const word of r.data.passphrase.split('-')) {
        expect(word[0]).toBe(word[0]!.toUpperCase())
      }
    }
  })

  it('appends a digit when number is enabled', async () => {
    const r = await run({ words: 4, number: true })
    if (r.success) expect(/[0-9]/.test(r.data.passphrase)).toBe(true)
  })

  it('reports entropy proportional to word count', async () => {
    const four = await run({ words: 4 })
    const eight = await run({ words: 8 })
    if (four.success && eight.success) {
      expect(eight.data.entropyBits).toBeGreaterThan(four.data.entropyBits)
    }
  })

  it('generates unique passphrases across runs', async () => {
    const results = await Promise.all(Array.from({ length: 10 }, () => run({ words: 6 })))
    const phrases = results.map((r) => (r.success ? r.data.passphrase : ''))
    expect(new Set(phrases).size).toBe(10)
  })
})
