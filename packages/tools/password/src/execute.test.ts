import { describe, it, expect } from 'vitest'
import { buildContext } from '@mirror/core'
import { passwordTool } from './index.js'

const ctx = buildContext()

const gen = (opts: Partial<Parameters<typeof passwordTool.execute>[0]> = {}) =>
  passwordTool.execute(
    {
      action: 'generate',
      length: 16,
      uppercase: true,
      numbers: true,
      symbols: false,
      excludeAmbiguous: false,
      requireEach: false,
      noRepeat: false,
      ...opts,
    },
    ctx
  )

describe('length', () => {
  it('generates correct length', async () => {
    const r = await gen({ length: 20 })
    expect(r.success).toBe(true)
    if (r.success) expect(r.data.password).toHaveLength(20)
  })

  it('respects min (8) and max (128)', async () => {
    const r8 = await gen({ length: 8 })
    const r128 = await gen({ length: 128 })
    if (r8.success) expect(r8.data.password).toHaveLength(8)
    if (r128.success) expect(r128.data.password).toHaveLength(128)
  })
})

describe('charset options', () => {
  it('lowercase only when all disabled', async () => {
    const r = await gen({ uppercase: false, numbers: false, symbols: false, length: 50 })
    if (r.success) expect(r.data.password).toMatch(/^[a-z]+$/)
  })

  it('includes uppercase when enabled', async () => {
    const passwords = await Promise.all(
      Array.from({ length: 20 }, () =>
        gen({ uppercase: true, numbers: false, symbols: false, length: 32 })
      )
    )
    expect(passwords.some((r) => r.success && /[A-Z]/.test(r.data.password))).toBe(true)
  })

  it('includes numbers when enabled', async () => {
    const passwords = await Promise.all(
      Array.from({ length: 20 }, () =>
        gen({ numbers: true, uppercase: false, symbols: false, length: 32 })
      )
    )
    expect(passwords.some((r) => r.success && /[0-9]/.test(r.data.password))).toBe(true)
  })

  it('includes symbols when enabled', async () => {
    const passwords = await Promise.all(
      Array.from({ length: 20 }, () => gen({ symbols: true, length: 32 }))
    )
    expect(passwords.some((r) => r.success && /[!@#$%^&*]/.test(r.data.password))).toBe(true)
  })
})

describe('excludeAmbiguous', () => {
  it('removes 0 O 1 l I | from output', async () => {
    const passwords = await Promise.all(
      Array.from({ length: 30 }, () => gen({ excludeAmbiguous: true, length: 64 }))
    )
    const all = passwords.map((r) => (r.success ? r.data.password : '')).join('')
    expect(all).not.toMatch(/[0O1lI|]/)
  })
})

describe('exclude / include', () => {
  it('exclude removes specific chars', async () => {
    const r = await gen({
      exclude: 'abcdefghijklmnopqrstuvwxyz',
      uppercase: true,
      numbers: true,
      symbols: false,
      length: 32,
    })
    if (r.success) expect(r.data.password).toMatch(/^[A-Z0-9]+$/)
  })

  it('include adds custom chars to charset', async () => {
    const passwords = await Promise.all(
      Array.from({ length: 30 }, () =>
        gen({ uppercase: false, numbers: false, symbols: false, include: '€£', length: 32 })
      )
    )
    expect(passwords.some((r) => r.success && /[€£]/.test(r.data.password))).toBe(true)
  })

  it('returns error when charset empty after exclusions', async () => {
    const r = await gen({
      exclude: 'abcdefghijklmnopqrstuvwxyz',
      uppercase: false,
      numbers: false,
      symbols: false,
    })
    expect(r.success).toBe(false)
    if (!r.success) expect(r.error.code).toBe('VALIDATION_ERROR')
  })
})

describe('requireEach', () => {
  it('guarantees at least one of each active type', async () => {
    for (let i = 0; i < 20; i++) {
      const r = await gen({
        uppercase: true,
        numbers: true,
        symbols: true,
        requireEach: true,
        length: 16,
      })
      expect(r.success).toBe(true)
      if (r.success) {
        expect(r.data.password).toMatch(/[a-z]/)
        expect(r.data.password).toMatch(/[A-Z]/)
        expect(r.data.password).toMatch(/[0-9]/)
        expect(r.data.password).toMatch(/[!@#$%^&*()_+\-=[\]{}|;:,.<>?]/)
      }
    }
  })
})

describe('noRepeat', () => {
  it('generates no repeated chars', async () => {
    const r = await gen({
      noRepeat: true,
      length: 20,
      uppercase: true,
      numbers: true,
      symbols: true,
    })
    if (r.success) {
      const chars = r.data.password.split('')
      expect(new Set(chars).size).toBe(chars.length)
    }
  })

  it('returns error when length > charset size', async () => {
    const r = await gen({
      noRepeat: true,
      length: 128,
      uppercase: false,
      numbers: false,
      symbols: false,
    })
    expect(r.success).toBe(false)
    if (!r.success) expect(r.error.code).toBe('VALIDATION_ERROR')
  })
})

describe('separator', () => {
  it('groups chars with separator', async () => {
    const r = await gen({ length: 16, separator: { char: '-', every: 4 } })
    if (r.success) {
      const parts = r.data.password.split('-')
      expect(parts).toHaveLength(4)
      expect(parts.every((p) => p.length === 4)).toBe(true)
    }
  })
})

describe('prefix / suffix', () => {
  it('prepends prefix and appends suffix', async () => {
    const r = await gen({ prefix: 'START_', suffix: '_END' })
    if (r.success) {
      expect(r.data.password.startsWith('START_')).toBe(true)
      expect(r.data.password.endsWith('_END')).toBe(true)
    }
  })
})

describe('uniqueness', () => {
  it('generates unique passwords across runs', async () => {
    const results = await Promise.all(Array.from({ length: 10 }, () => gen({ length: 16 })))
    const passwords = results.map((r) => (r.success ? r.data.password : ''))
    expect(new Set(passwords).size).toBe(10)
  })
})
