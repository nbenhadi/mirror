import { readFile, readdir, mkdir, writeFile, access, rm } from 'node:fs/promises'
import { join } from 'node:path'
import { getUserDataDir } from '@nbenhadi/mirror-config'
import { getBundledTheme, BUNDLED_THEMES } from '../themes/registry.js'

const THEME_TEMPLATE_CSS = 'body {\n  font-family: sans-serif;\n}\n'

export interface ThemeInfo {
  id: string
  description: string
  source: 'bundled' | 'user'
}

import type { Margins } from '../themes/types.js'

export interface ThemeManifest {
  description?: string
  margins?: Margins
}

function themeCssPath(id: string): string {
  return join(userThemeDir(id), 'theme.css')
}

export function userThemesDir(): string {
  return join(getUserDataDir(), 'md', 'themes')
}

function userThemeDir(id: string): string {
  return join(userThemesDir(), id)
}

async function readThemeManifest(id: string): Promise<ThemeManifest> {
  try {
    const raw = await readFile(join(userThemeDir(id), 'theme.json'), 'utf-8')
    return JSON.parse(raw) as ThemeManifest
  } catch {
    return {}
  }
}

export async function resolveThemeCss(themeId: string): Promise<string | undefined> {
  const bundled = getBundledTheme(themeId)
  if (bundled) return bundled.css

  try {
    return await readFile(themeCssPath(themeId), 'utf-8')
  } catch {
    return undefined
  }
}

export async function resolveThemeMargins(themeId: string): Promise<Margins> {
  const bundled = getBundledTheme(themeId)
  if (bundled?.margins !== undefined) return bundled.margins

  const manifest = await readThemeManifest(themeId)
  if (manifest.margins !== undefined) return manifest.margins

  return { x: 56, y: 52 }
}

export async function listThemes(): Promise<ThemeInfo[]> {
  const bundled: ThemeInfo[] = BUNDLED_THEMES.map((theme) => ({
    id: theme.id,
    description: theme.description,
    source: 'bundled',
  }))

  let entries
  try {
    entries = await readdir(userThemesDir(), { withFileTypes: true })
  } catch {
    return bundled
  }

  const user: ThemeInfo[] = []
  for (const entry of entries) {
    if (!entry.isDirectory()) continue
    const manifest = await readThemeManifest(entry.name)
    user.push({
      id: entry.name,
      description: manifest.description ?? '',
      source: 'user',
    })
  }

  return [...bundled, ...user]
}

async function themeDirExists(id: string): Promise<boolean> {
  try {
    await access(userThemeDir(id))
    return true
  } catch {
    return false
  }
}

export async function createTheme(
  id: string,
  description = ''
): Promise<{ cssPath: string } | null> {
  if (getBundledTheme(id) || (await themeDirExists(id))) return null

  const dir = userThemeDir(id)
  await mkdir(dir, { recursive: true })
  const cssPath = themeCssPath(id)
  await writeFile(cssPath, THEME_TEMPLATE_CSS, 'utf-8')
  await writeFile(join(dir, 'theme.json'), `${JSON.stringify({ description }, null, 2)}\n`, 'utf-8')
  return { cssPath }
}

export async function editableThemeCssPath(id: string): Promise<string | null> {
  if (getBundledTheme(id) || !(await themeDirExists(id))) return null
  return themeCssPath(id)
}

export async function deleteTheme(id: string): Promise<boolean> {
  if (getBundledTheme(id) || !(await themeDirExists(id))) return false
  await rm(userThemeDir(id), { recursive: true, force: true })
  return true
}
