import { describe, it, expect } from 'vitest'
import { deepMerge, isPlainObject } from './merge.js'

describe('deepMerge', () => {
  it('preserves keys absent from the patch (salt never dropped)', () => {
    const base = { tools: { vault: { path: '/v', salt: 'abc', kdf: { timeCost: 3 } } } }
    const out = deepMerge(base, { lang: 'es' })
    expect(out).toEqual({
      lang: 'es',
      tools: { vault: { path: '/v', salt: 'abc', kdf: { timeCost: 3 } } },
    })
  })

  it('merges nested objects key-by-key', () => {
    const base = { tui: { keybindings: { back: 'q', select: 'return' } } }
    const out = deepMerge(base, { tui: { keybindings: { back: 'b' } } })
    expect(out).toEqual({ tui: { keybindings: { back: 'b', select: 'return' } } })
  })

  it('replaces arrays and primitives wholesale', () => {
    const out = deepMerge({ a: [1, 2], b: 1 }, { a: [3], b: 2 })
    expect(out).toEqual({ a: [3], b: 2 })
  })

  it('ignores undefined patch values', () => {
    const out = deepMerge({ a: 1 }, { a: undefined })
    expect(out).toEqual({ a: 1 })
  })

  it('does not mutate the base object', () => {
    const base = { tools: { vault: { salt: 'abc' } } }
    deepMerge(base, { tools: { vault: { path: '/x' } } })
    expect(base).toEqual({ tools: { vault: { salt: 'abc' } } })
  })
})

describe('isPlainObject', () => {
  it('accepts plain objects only', () => {
    expect(isPlainObject({})).toBe(true)
    expect(isPlainObject([])).toBe(false)
    expect(isPlainObject(null)).toBe(false)
    expect(isPlainObject('x')).toBe(false)
  })
})
