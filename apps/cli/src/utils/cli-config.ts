import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'node:fs'
import { getConfigDir, getConfigPath } from '@nbenhadi/mirror-config'

const CONFIG_DIR = getConfigDir()
const CONFIG_FILE = getConfigPath()

interface CliConfig {
  locale?: string
}

export function readCliConfig(): CliConfig {
  if (!existsSync(CONFIG_FILE)) return {}
  try {
    return JSON.parse(readFileSync(CONFIG_FILE, 'utf8')) as CliConfig
  } catch {
    return {}
  }
}

export function writeCliConfig(updates: Partial<CliConfig>): void {
  const current = readCliConfig()
  mkdirSync(CONFIG_DIR, { recursive: true })
  writeFileSync(CONFIG_FILE, JSON.stringify({ ...current, ...updates }, null, 2))
}
