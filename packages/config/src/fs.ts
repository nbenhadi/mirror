import { readFile, writeFile, mkdir, rename, chmod } from 'node:fs/promises'
import { existsSync } from 'node:fs'
import { getConfigDir, getConfigPath } from './paths.js'

const FILE_MODE = 0o600

export async function readRaw(): Promise<Record<string, unknown>> {
  const path = getConfigPath()
  if (!existsSync(path)) return {}
  try {
    const parsed = JSON.parse(await readFile(path, 'utf8')) as unknown
    return typeof parsed === 'object' && parsed !== null ? (parsed as Record<string, unknown>) : {}
  } catch {
    return {}
  }
}

export async function writeRaw(data: unknown): Promise<void> {
  const dir = getConfigDir()
  if (!existsSync(dir)) await mkdir(dir, { recursive: true })

  const target = getConfigPath()
  const tmp = `${target}.tmp`
  await writeFile(tmp, JSON.stringify(data, null, 2), { mode: FILE_MODE })
  await chmod(tmp, FILE_MODE)
  await rename(tmp, target)
  await chmod(target, FILE_MODE)
}
