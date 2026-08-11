import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { mkdtemp, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { resolveThemeCss, listThemes, createTheme } from './themes.js'

const mockGetUserDataDir = vi.fn()
vi.mock('@nbenhadi/mirror-config', () => ({
  getUserDataDir: () => mockGetUserDataDir(),
}))

let dir: string

beforeEach(async () => {
  dir = await mkdtemp(join(tmpdir(), 'mirror-md-themes-'))
  mockGetUserDataDir.mockReturnValue(dir)
})

afterEach(async () => {
  await rm(dir, { recursive: true, force: true })
})

describe('resolveThemeCss', () => {
  it('returns the bundled default theme css', async () => {
    const css = await resolveThemeCss('default')
    expect(css).toContain('body')
  })

  it('returns undefined for an unknown theme', async () => {
    const css = await resolveThemeCss('does-not-exist')
    expect(css).toBeUndefined()
  })

  it('reads a user theme css from disk', async () => {
    expect(await createTheme('mine')).not.toBeNull()
    const css = await resolveThemeCss('mine')
    expect(css).toContain('font-family')
  })
})

describe('createTheme', () => {
  it('refuses to shadow an existing bundled theme id', async () => {
    expect(await createTheme('default')).toBeNull()
  })

  it('refuses to create the same theme twice', async () => {
    expect(await createTheme('dup')).not.toBeNull()
    expect(await createTheme('dup')).toBeNull()
  })

  it('returns the path to the created css file', async () => {
    const created = await createTheme('mine')
    expect(created?.cssPath).toMatch(/mine[/\\]theme\.css$/)
  })

  it('writes the description into the manifest', async () => {
    await createTheme('mine', 'my custom theme')
    const themes = await listThemes()
    expect(themes.find((t) => t.id === 'mine')).toMatchObject({ description: 'my custom theme' })
  })
})

describe('listThemes', () => {
  it('lists bundled themes even with no user themes dir', async () => {
    const themes = await listThemes()
    expect(themes.some((t) => t.id === 'default' && t.source === 'bundled')).toBe(true)
  })

  it('includes user themes, bundled first', async () => {
    await createTheme('mine')
    const themes = await listThemes()
    expect(themes[0]?.source).toBe('bundled')
    expect(themes.find((t) => t.id === 'mine')).toMatchObject({ source: 'user' })
  })
})
