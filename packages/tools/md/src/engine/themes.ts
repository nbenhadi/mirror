import { readFile, readdir, mkdir, writeFile, access, rm } from 'node:fs/promises'
import { join } from 'node:path'
import { getUserDataDir } from '@nbenhadi/mirror-config'
import { getBundledTheme, BUNDLED_THEMES } from '../themes/registry.js'
import { getBundledSlideTheme, BUNDLED_SLIDE_THEMES } from '../themes/slide-registry.js'
import { THEME_KINDS, type Margins, type ThemeKind } from '../themes/types.js'

const THEME_TEMPLATE_CSS = 'body {\n  font-family: sans-serif;\n}\n'
const SLIDE_THEME_TEMPLATE_CSS = '/* @theme custom */\n\nsection {\n  font-family: sans-serif;\n}\n'

export interface ThemeInfo {
  id: string
  description: string
  source: 'bundled' | 'user'
}

export interface ThemeManifest {
  description?: string
  margins?: Margins
}

const RESERVED_DOCUMENT_IDS = new Set<string>(THEME_KINDS.filter((kind) => kind !== 'document'))

function userThemesDir(kind: ThemeKind): string {
  const base = join(getUserDataDir(), 'md', 'themes')
  return kind === 'document' ? base : join(base, kind)
}

function isReservedId(kind: ThemeKind, id: string): boolean {
  return kind === 'document' && RESERVED_DOCUMENT_IDS.has(id)
}

function userThemeDir(kind: ThemeKind, id: string): string {
  return join(userThemesDir(kind), id)
}

function themeCssPath(kind: ThemeKind, id: string): string {
  return join(userThemeDir(kind, id), 'theme.css')
}

function bundledThemeExists(kind: ThemeKind, id: string): boolean {
  return kind === 'document'
    ? getBundledTheme(id) !== undefined
    : getBundledSlideTheme(id) !== undefined
}

function bundledThemeList(kind: ThemeKind): ThemeInfo[] {
  const themes = kind === 'document' ? BUNDLED_THEMES : BUNDLED_SLIDE_THEMES
  return themes.map((theme) => ({
    id: theme.id,
    description: theme.description,
    source: 'bundled',
  }))
}

async function readThemeManifest(kind: ThemeKind, id: string): Promise<ThemeManifest> {
  try {
    const raw = await readFile(join(userThemeDir(kind, id), 'theme.json'), 'utf-8')
    return JSON.parse(raw) as ThemeManifest
  } catch {
    return {}
  }
}

export async function resolveThemeCss(
  kind: ThemeKind,
  themeId: string
): Promise<string | undefined> {
  if (kind === 'document') {
    const bundled = getBundledTheme(themeId)
    if (bundled) return bundled.css
  }

  try {
    return await readFile(themeCssPath(kind, themeId), 'utf-8')
  } catch {
    return undefined
  }
}

export async function resolveThemeMargins(themeId: string): Promise<Margins> {
  const bundled = getBundledTheme(themeId)
  if (bundled?.margins !== undefined) return bundled.margins

  const manifest = await readThemeManifest('document', themeId)
  if (manifest.margins !== undefined) return manifest.margins

  return { x: 56, y: 52 }
}

export async function listThemes(kind: ThemeKind): Promise<ThemeInfo[]> {
  const bundled = bundledThemeList(kind)

  let entries
  try {
    entries = await readdir(userThemesDir(kind), { withFileTypes: true })
  } catch {
    return bundled
  }

  const user: ThemeInfo[] = []
  for (const entry of entries) {
    if (!entry.isDirectory()) continue
    if (isReservedId(kind, entry.name)) continue
    const manifest = await readThemeManifest(kind, entry.name)
    user.push({
      id: entry.name,
      description: manifest.description ?? '',
      source: 'user',
    })
  }

  return [...bundled, ...user]
}

async function themeDirExists(kind: ThemeKind, id: string): Promise<boolean> {
  try {
    await access(userThemeDir(kind, id))
    return true
  } catch {
    return false
  }
}

export async function createTheme(
  kind: ThemeKind,
  id: string,
  description = ''
): Promise<{ cssPath: string } | null> {
  if (isReservedId(kind, id) || bundledThemeExists(kind, id) || (await themeDirExists(kind, id)))
    return null

  const dir = userThemeDir(kind, id)
  await mkdir(dir, { recursive: true })
  const cssPath = themeCssPath(kind, id)
  const template = kind === 'slide' ? SLIDE_THEME_TEMPLATE_CSS : THEME_TEMPLATE_CSS
  await writeFile(cssPath, template, 'utf-8')
  await writeFile(join(dir, 'theme.json'), `${JSON.stringify({ description }, null, 2)}\n`, 'utf-8')
  return { cssPath }
}

export async function editableThemeCssPath(kind: ThemeKind, id: string): Promise<string | null> {
  if (isReservedId(kind, id) || bundledThemeExists(kind, id) || !(await themeDirExists(kind, id)))
    return null
  return themeCssPath(kind, id)
}

export async function deleteTheme(kind: ThemeKind, id: string): Promise<boolean> {
  if (isReservedId(kind, id) || bundledThemeExists(kind, id) || !(await themeDirExists(kind, id)))
    return false
  await rm(userThemeDir(kind, id), { recursive: true, force: true })
  return true
}
