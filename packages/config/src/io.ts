import { configSchema, type AppConfig } from './schema.js'
import { readRaw, writeRaw } from './fs.js'
import { deepMerge, type DeepPartial } from './merge.js'

export async function readConfig(): Promise<AppConfig> {
  const raw = await readRaw()
  const parsed = configSchema.safeParse(raw)
  return parsed.success ? parsed.data : (raw as AppConfig)
}

export async function patchConfig(patch: DeepPartial<AppConfig>): Promise<void> {
  const current = await readRaw()
  const next = deepMerge(current, patch as Record<string, unknown>)
  if (next['version'] === undefined) next['version'] = 1
  await writeRaw(next)
}
