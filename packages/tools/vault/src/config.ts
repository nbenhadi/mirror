import { readFile, writeFile, mkdir } from 'node:fs/promises'
import { existsSync } from 'node:fs'
import { homedir } from 'node:os'
import { join } from 'node:path'
import type { MirrorConfig } from './types.js'

export function getConfigDir(): string {
  return join(homedir(), '.config', 'mirror')
}

export function getConfigPath(): string {
  return join(getConfigDir(), 'config.json')
}

export async function ensureConfigDir(): Promise<void> {
  const dir = getConfigDir()
  if (!existsSync(dir)) {
    await mkdir(dir, { recursive: true })
  }
}

export async function loadConfig(): Promise<MirrorConfig> {
  const path = getConfigPath()
  if (!existsSync(path)) return {}
  const raw = await readFile(path, 'utf8')
  return JSON.parse(raw) as MirrorConfig
}

export async function saveConfig(config: MirrorConfig): Promise<void> {
  await ensureConfigDir()
  await writeFile(getConfigPath(), JSON.stringify(config, null, 2), 'utf8')
}
