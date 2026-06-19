import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'node:fs'
import { join } from 'node:path'
import { homedir } from 'node:os'

const CONFIG_DIR = join(homedir(), '.mirror')
const CONFIG_FILE = join(CONFIG_DIR, 'config.json')

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
