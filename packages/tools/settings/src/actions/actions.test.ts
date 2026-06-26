import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { mkdtemp, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { patchConfig } from '@nbenhadi/mirror-config'
import { get } from './get.js'
import { set } from './set.js'
import { reset } from './reset.js'
import { list } from './list.js'

let home: string
const env = { ...process.env }

beforeEach(async () => {
  home = await mkdtemp(join(tmpdir(), 'mirror-settings-'))
  process.env['HOME'] = home
  process.env['XDG_CONFIG_HOME'] = join(home, '.config')
})

afterEach(async () => {
  process.env['HOME'] = env['HOME']
  process.env['XDG_CONFIG_HOME'] = env['XDG_CONFIG_HOME']
  await rm(home, { recursive: true, force: true })
})

describe('set', () => {
  it('writes an editable field', async () => {
    const r = await set({ action: 'set', key: 'general.lang', value: 'es' })
    expect(r.success).toBe(true)
    const g = await get({ action: 'get', key: 'general.lang' })
    expect(g.success && g.data.value).toBe('es')
  })

  it('rejects a protected field', async () => {
    const r = await set({ action: 'set', key: 'tools.vault.salt', value: 'x' })
    expect(r.success).toBe(false)
    if (!r.success) expect(r.error.code).toBe('FORBIDDEN')
  })

  it('rejects an unknown field', async () => {
    const r = await set({ action: 'set', key: 'nope', value: 'x' })
    expect(r.success).toBe(false)
    if (!r.success) expect(r.error.code).toBe('NOT_FOUND')
  })

  it('rejects an invalid lang value', async () => {
    const r = await set({ action: 'set', key: 'general.lang', value: 'xx' })
    expect(r.success).toBe(false)
    if (!r.success) expect(r.error.code).toBe('VALIDATION_ERROR')
  })

  it('does not drop the vault salt when setting lang', async () => {
    await patchConfig({
      tools: {
        vault: { path: '/v', salt: 'abc', kdf: { memoryCost: 1, timeCost: 1, parallelism: 1 } },
      },
    })
    await set({ action: 'set', key: 'general.lang', value: 'fr' })
    const g = await get({ action: 'get', key: 'tools.vault.path' })
    expect(g.success && g.data.value).toBe('/v')
  })
})

describe('get', () => {
  it('returns the default when unset', async () => {
    const r = await get({ action: 'get', key: 'general.lang' })
    expect(r.success && r.data.value).toBe('en')
  })

  it('rejects reading a protected field', async () => {
    const r = await get({ action: 'get', key: 'tools.vault.salt' })
    expect(r.success).toBe(false)
    if (!r.success) expect(r.error.code).toBe('FORBIDDEN')
  })

  it('returns the full editable view without a key', async () => {
    const r = await get({ action: 'get' })
    expect(r.success).toBe(true)
    if (r.success) {
      const general = (r.data.value as Record<string, unknown>)['general'] as
        | Record<string, unknown>
        | undefined
      expect(general?.['lang']).toBe('en')
    }
  })
})

describe('list', () => {
  it('marks unset fields as default', async () => {
    const r = await list()
    expect(r.success).toBe(true)
    if (r.success) {
      if (r.data.action === 'list') {
        const general = r.data.settings['general'] as Record<string, unknown> | undefined
        expect(general?.['lang']).toBe('en')
      }
    }
  })
})

describe('reset', () => {
  it('dry-run reports changes without writing', async () => {
    await set({ action: 'set', key: 'general.lang', value: 'es' })
    const r = await reset({ action: 'reset', apply: false })
    expect(r.success).toBe(true)
    if (r.success && r.data.action === 'reset') {
      expect(r.data.applied).toBe(false)
      expect(r.data.diff.hasChanges).toBe(true)
    }
    const g = await get({ action: 'get', key: 'general.lang' })
    expect(g.success && g.data.value).toBe('es')
  })

  it('apply writes the defaults', async () => {
    await set({ action: 'set', key: 'general.lang', value: 'es' })
    const r = await reset({ action: 'reset', apply: true })
    expect(r.success && r.data.action === 'reset' && r.data.applied).toBe(true)
    const g = await get({ action: 'get', key: 'general.lang' })
    expect(g.success && g.data.value).toBe('en')
  })

  it('reports no changes when already at defaults', async () => {
    const r = await reset({ action: 'reset', apply: true })
    if (r.success && r.data.action === 'reset') {
      expect(r.data.diff.hasChanges).toBe(false)
      expect(r.data.applied).toBe(false)
    }
  })

  it('allows resetting tools.vault.path (has a default)', async () => {
    const r = await reset({ action: 'reset', key: 'tools.vault.path', apply: false })
    expect(r.success).toBe(true)
  })

  it('rejects resetting a protected field', async () => {
    const r = await reset({ action: 'reset', key: 'version', apply: false })
    expect(r.success).toBe(false)
    if (!r.success) expect(r.error.code).toBe('FORBIDDEN')
  })
})
