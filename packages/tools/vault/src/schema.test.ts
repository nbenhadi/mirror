import { describe, it, expect } from 'vitest'
import { schema } from './schema.js'

describe('schema validation', () => {
  it('rejects add without title', () => {
    const r = schema.safeParse({ action: 'add', password: 'x' })
    expect(r.success).toBe(false)
  })

  it('accepts add with title only', () => {
    const r = schema.safeParse({ action: 'add', title: 'GitHub' })
    expect(r.success).toBe(true)
  })

  it('accepts add with all fields', () => {
    const r = schema.safeParse({
      action: 'add',
      title: 'GitHub',
      username: 'user@mail.com',
      password: 'secret',
      url: 'https://github.com',
      notes: 'my notes',
      tags: ['work'],
    })
    expect(r.success).toBe(true)
  })

  it('rejects add with invalid url', () => {
    const r = schema.safeParse({ action: 'add', title: 'Test', url: 'not-a-url' })
    expect(r.success).toBe(false)
  })

  it('rejects unlock with masterPassword shorter than 1', () => {
    const r = schema.safeParse({ action: 'unlock', masterPassword: '', minutes: 30 })
    expect(r.success).toBe(false)
  })

  it('rejects init with masterPassword shorter than 8', () => {
    const r = schema.safeParse({ action: 'init', masterPassword: 'short' })
    expect(r.success).toBe(false)
  })

  it('rejects rekey with newPassword shorter than 8', () => {
    const r = schema.safeParse({ action: 'rekey', currentPassword: 'old', newPassword: 'short' })
    expect(r.success).toBe(false)
  })

  it('defaults list fields to undefined', () => {
    const r = schema.safeParse({ action: 'list' })
    expect(r.success).toBe(true)
    if (r.success) {
      expect(r.data.action).toBe('list')
    }
  })

  it('rejects delete with empty title', () => {
    const r = schema.safeParse({ action: 'delete', title: '' })
    expect(r.success).toBe(false)
  })

  it('defaults delete force to false', () => {
    const r = schema.safeParse({ action: 'delete', title: 'Test' })
    expect(r.success).toBe(true)
    if (r.success && r.data.action === 'delete') {
      expect(r.data.force).toBe(false)
    }
  })

  it('defaults list reveal to false', () => {
    const r = schema.safeParse({ action: 'list' })
    expect(r.success).toBe(true)
    if (r.success && r.data.action === 'list') {
      expect(r.data.reveal).toBe(false)
    }
  })

  it('accepts edit with empty url to clear it', () => {
    const r = schema.safeParse({ action: 'edit', entry: 'Test', url: '' })
    expect(r.success).toBe(true)
  })

  it('rejects edit with an invalid non-empty url', () => {
    const r = schema.safeParse({ action: 'edit', entry: 'Test', url: 'not-a-url' })
    expect(r.success).toBe(false)
  })

  it('accepts tag.add with a name', () => {
    const r = schema.safeParse({ action: 'tag.add', name: 'work' })
    expect(r.success).toBe(true)
  })

  it('rejects tag.add without a name', () => {
    const r = schema.safeParse({ action: 'tag.add' })
    expect(r.success).toBe(false)
  })

  it('accepts tag.edit with name and newName', () => {
    const r = schema.safeParse({ action: 'tag.edit', name: 'work', newName: 'job' })
    expect(r.success).toBe(true)
  })

  it('rejects tag.edit without newName', () => {
    const r = schema.safeParse({ action: 'tag.edit', name: 'work' })
    expect(r.success).toBe(false)
  })

  it('accepts tag.delete with a name', () => {
    const r = schema.safeParse({ action: 'tag.delete', name: 'work' })
    expect(r.success).toBe(true)
  })

  it('accepts tag.list with no fields', () => {
    const r = schema.safeParse({ action: 'tag.list' })
    expect(r.success).toBe(true)
  })
})
