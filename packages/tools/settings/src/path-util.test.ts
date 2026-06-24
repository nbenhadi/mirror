import { describe, it, expect } from 'vitest'
import { getByPath, buildPatch } from './path-util.js'

describe('getByPath', () => {
  const obj = { lang: 'es', tools: { vault: { path: '/v' } } }

  it('reads nested values', () => {
    expect(getByPath(obj, 'tools.vault.path')).toBe('/v')
  })

  it('reads top-level values', () => {
    expect(getByPath(obj, 'lang')).toBe('es')
  })

  it('returns undefined for missing paths', () => {
    expect(getByPath(obj, 'tools.vault.salt')).toBeUndefined()
    expect(getByPath(obj, 'nope.nope')).toBeUndefined()
  })
})

describe('buildPatch', () => {
  it('builds a nested object from a dotted key', () => {
    expect(buildPatch('tui.keybindings.back', 'b')).toEqual({
      tui: { keybindings: { back: 'b' } },
    })
  })

  it('builds a flat object for a single segment', () => {
    expect(buildPatch('lang', 'fr')).toEqual({ lang: 'fr' })
  })
})
