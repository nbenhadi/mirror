import { readFileSync } from 'node:fs'
import { existsSync } from 'node:fs'
import { getConfigPath } from './paths.js'
import { configSchema, type AppConfig } from './schema.js'

export function readConfigSync(): AppConfig {
  const path = getConfigPath()
  if (existsSync(path)) {
    try {
      const raw = JSON.parse(readFileSync(path, 'utf8')) as unknown
      const parsed = configSchema.safeParse(raw)
      return parsed.success ? parsed.data : (raw as AppConfig)
    } catch {
      // corrupt config file must not crash startup, fall back to defaults below
    }
  }

  return {}
}
