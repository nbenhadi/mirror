import { describe, it, expect } from 'vitest'
import { schema } from './schema.js'

describe('schema validation', () => {
  it('accepts export with only path', () => {
    const r = schema.safeParse({ action: 'export', path: 'cv.md' })
    expect(r.success).toBe(true)
  })

  it('rejects export without path', () => {
    const r = schema.safeParse({ action: 'export' })
    expect(r.success).toBe(false)
  })

  it('applies default format and leaves theme unset', () => {
    const r = schema.safeParse({ action: 'export', path: 'cv.md' })
    expect(r.success).toBe(true)
    if (r.success && r.data.action === 'export') {
      expect(r.data.theme).toBeUndefined()
      expect(r.data.format).toBe('pdf')
    }
  })

  it('rejects an invalid format', () => {
    const r = schema.safeParse({ action: 'export', path: 'cv.md', format: 'docx' })
    expect(r.success).toBe(false)
  })

  it('accepts a valid page range', () => {
    const r = schema.safeParse({ action: 'export', path: 'cv.md', pages: '1,3,5-7' })
    expect(r.success).toBe(true)
  })

  it('rejects an invalid page range', () => {
    const r = schema.safeParse({ action: 'export', path: 'cv.md', pages: 'all' })
    expect(r.success).toBe(false)
  })

  it('accepts preview with only path and defaults port to 0', () => {
    const r = schema.safeParse({ action: 'preview', path: 'cv.md' })
    expect(r.success).toBe(true)
    if (r.success && r.data.action === 'preview') {
      expect(r.data.port).toBe(0)
    }
  })

  it('rejects preview without path', () => {
    const r = schema.safeParse({ action: 'preview' })
    expect(r.success).toBe(false)
  })

  it('rejects an out of range port', () => {
    const r = schema.safeParse({ action: 'preview', path: 'cv.md', port: 70000 })
    expect(r.success).toBe(false)
  })

  it('accepts import with only path', () => {
    const r = schema.safeParse({ action: 'import', path: 'doc.html' })
    expect(r.success).toBe(true)
  })

  it('accepts theme.create with a name', () => {
    const r = schema.safeParse({ action: 'theme.create', name: 'sidebar' })
    expect(r.success).toBe(true)
  })

  it('rejects theme.create without a name', () => {
    const r = schema.safeParse({ action: 'theme.create' })
    expect(r.success).toBe(false)
  })

  it('accepts theme.edit with a name', () => {
    const r = schema.safeParse({ action: 'theme.edit', name: 'sidebar' })
    expect(r.success).toBe(true)
  })

  it('accepts theme.delete with a name', () => {
    const r = schema.safeParse({ action: 'theme.delete', name: 'sidebar' })
    expect(r.success).toBe(true)
  })

  it('accepts theme.list with no fields', () => {
    const r = schema.safeParse({ action: 'theme.list' })
    expect(r.success).toBe(true)
  })

  it('defaults theme.list kind to document', () => {
    const r = schema.safeParse({ action: 'theme.list' })
    expect(r.success).toBe(true)
    if (r.success && r.data.action === 'theme.list') {
      expect(r.data.kind).toBe('document')
    }
  })

  it('accepts theme.create with an explicit slide kind', () => {
    const r = schema.safeParse({ action: 'theme.create', name: 'gaia-custom', kind: 'slide' })
    expect(r.success).toBe(true)
    if (r.success && r.data.action === 'theme.create') {
      expect(r.data.kind).toBe('slide')
    }
  })

  it('rejects an invalid theme kind', () => {
    const r = schema.safeParse({ action: 'theme.create', name: 'x', kind: 'presentation' })
    expect(r.success).toBe(false)
  })

  it('accepts slides with only path and defaults format to pdf', () => {
    const r = schema.safeParse({ action: 'slides', path: 'deck.md' })
    expect(r.success).toBe(true)
    if (r.success && r.data.action === 'slides') {
      expect(r.data.format).toBe('pdf')
      expect(r.data.theme).toBeUndefined()
    }
  })

  it('rejects slides without path', () => {
    const r = schema.safeParse({ action: 'slides' })
    expect(r.success).toBe(false)
  })

  it('rejects an invalid slides format', () => {
    const r = schema.safeParse({ action: 'slides', path: 'deck.md', format: 'png' })
    expect(r.success).toBe(false)
  })
})
