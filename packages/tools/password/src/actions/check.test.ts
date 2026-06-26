import { describe, it, expect } from 'vitest'
import { buildContext } from '@nbenhadi/mirror-core'
import { check } from './check.js'

const ctx = buildContext()

const run = (password: string) => check({ action: 'check', password }, ctx)

describe('check', () => {
  it('scores a weak short password low', async () => {
    const r = await run('abc')
    expect(r.success).toBe(true)
    if (r.success) {
      expect(r.data.score).toBeLessThanOrEqual(1)
      expect(r.data.warnings).toContain('too-short')
    }
  })

  it('scores a long mixed password high', async () => {
    const r = await run('Tr0ub4dour&3xpl0re!Zq')
    if (r.success) {
      expect(r.data.score).toBeGreaterThanOrEqual(3)
      expect(r.data.poolSize).toBeGreaterThan(80)
      expect(r.data.severity).toBe('success')
    }
  })

  it('maps score to a display severity', async () => {
    const weak = await run('abc')
    const strong = await run('Tr0ub4dour&3xpl0re!Zq')
    if (weak.success) expect(weak.data.severity).toBe('danger')
    if (strong.success) expect(strong.data.severity).toBe('success')
  })

  it('reports entropy and pool size', async () => {
    const r = await run('aaaaaaaa')
    if (r.success) {
      expect(r.data.poolSize).toBe(26)
      expect(r.data.length).toBe(8)
      expect(r.data.entropyBits).toBeGreaterThan(0)
    }
  })

  it('penalises repeated runs', async () => {
    const plain = await run('xK9mPq2wL4nR')
    const repeat = await run('aaaXK9mPq2wL')
    if (plain.success && repeat.success) {
      expect(repeat.data.warnings).toContain('repeated-run')
    }
  })

  it('detects sequential runs', async () => {
    const r = await run('abcdEFGH1234')
    if (r.success) {
      expect(r.data.warnings).toContain('sequence')
      expect(r.data.effectiveBits).toBeLessThan(r.data.entropyBits)
    }
  })

  it('flags single character type', async () => {
    const r = await run('lowercaseonly')
    if (r.success) expect(r.data.warnings).toContain('single-type')
  })

  it('gives a human-readable crack time', async () => {
    const r = await run('Tr0ub4dour&3xpl0re!Zq')
    if (r.success) expect(typeof r.data.crackTime).toBe('string')
  })
})
