import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { mkdtemp, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import {
  resolveThemeCss,
  listThemes,
  createTheme,
  editableThemeCssPath,
  deleteTheme,
} from './themes.js'

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
    const css = await resolveThemeCss('document', 'default')
    expect(css).toContain('body')
  })

  it('returns undefined for an unknown theme', async () => {
    const css = await resolveThemeCss('document', 'does-not-exist')
    expect(css).toBeUndefined()
  })

  it('reads a user theme css from disk', async () => {
    expect(await createTheme('document', 'mine')).not.toBeNull()
    const css = await resolveThemeCss('document', 'mine')
    expect(css).toContain('font-family')
  })
})

describe('createTheme', () => {
  it('refuses to shadow an existing bundled theme id', async () => {
    expect(await createTheme('document', 'default')).toBeNull()
  })

  it('refuses to create the same theme twice', async () => {
    expect(await createTheme('document', 'dup')).not.toBeNull()
    expect(await createTheme('document', 'dup')).toBeNull()
  })

  it('returns the path to the created css file', async () => {
    const created = await createTheme('document', 'mine')
    expect(created?.cssPath).toMatch(/mine[/\\]theme\.css$/)
  })

  it('writes the description into the manifest', async () => {
    await createTheme('document', 'mine', 'my custom theme')
    const themes = await listThemes('document')
    expect(themes.find((t) => t.id === 'mine')).toMatchObject({ description: 'my custom theme' })
  })
})

describe('listThemes', () => {
  it('lists bundled themes even with no user themes dir', async () => {
    const themes = await listThemes('document')
    expect(themes.some((t) => t.id === 'default' && t.source === 'bundled')).toBe(true)
  })

  it('includes user themes, bundled first', async () => {
    await createTheme('document', 'mine')
    const themes = await listThemes('document')
    expect(themes[0]?.source).toBe('bundled')
    expect(themes.find((t) => t.id === 'mine')).toMatchObject({ source: 'user' })
  })
})

describe('slide theme kind', () => {
  it('lists the marp built-in themes as bundled', async () => {
    const themes = await listThemes('slide')
    expect(themes.some((t) => t.id === 'default' && t.source === 'bundled')).toBe(true)
    expect(themes.some((t) => t.id === 'gaia' && t.source === 'bundled')).toBe(true)
    expect(themes.some((t) => t.id === 'uncover' && t.source === 'bundled')).toBe(true)
  })

  it('does not collide with a document theme of the same id', async () => {
    expect(await createTheme('document', 'default')).toBeNull()
    expect(await createTheme('slide', 'default')).toBeNull()
    expect(await createTheme('slide', 'custom')).not.toBeNull()
    expect(await createTheme('document', 'custom')).not.toBeNull()

    const slideThemes = await listThemes('slide')
    const documentThemes = await listThemes('document')
    expect(slideThemes.find((t) => t.id === 'custom')).toMatchObject({ source: 'user' })
    expect(documentThemes.find((t) => t.id === 'custom')).toMatchObject({ source: 'user' })
  })

  it('does not leak the slide namespace folder as a document theme', async () => {
    expect(await createTheme('slide', 'custom')).not.toBeNull()

    const documentThemes = await listThemes('document')
    expect(documentThemes.find((t) => t.id === 'slide')).toBeUndefined()

    expect(await createTheme('document', 'slide')).toBeNull()
    expect(await editableThemeCssPath('document', 'slide')).toBeNull()
    expect(await deleteTheme('document', 'slide')).toBe(false)

    const slideThemesAfter = await listThemes('slide')
    expect(slideThemesAfter.find((t) => t.id === 'custom')).toMatchObject({ source: 'user' })
  })
})
