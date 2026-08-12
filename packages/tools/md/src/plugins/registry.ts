import { pathToFileURL } from 'node:url'
import { resolve, isAbsolute } from 'node:path'
import type { MdPlugin } from './types.js'
import type { PluginEntry } from '../engine/parse.js'

type PluginFactory = (config: Record<string, unknown>) => MdPlugin

const BUNDLED: Record<string, PluginFactory> = {}

const INVALID_PLUGIN_PREFIX = 'invalid md plugin: '

export function isInvalidPluginError(err: unknown): err is Error {
  return err instanceof Error && err.message.startsWith(INVALID_PLUGIN_PREFIX)
}

function isMdPlugin(value: unknown): value is MdPlugin {
  return (
    typeof value === 'object' &&
    value !== null &&
    typeof (value as { id?: unknown }).id === 'string'
  )
}

function normalizeEntry(entry: PluginEntry): { id: string; config: Record<string, unknown> } {
  if (typeof entry === 'string') return { id: entry, config: {} }
  const { id, ...config } = entry
  return { id, config }
}

export async function loadPlugins(entries: PluginEntry[], baseDir: string): Promise<MdPlugin[]> {
  const plugins: MdPlugin[] = []

  for (const entry of entries) {
    const { id, config } = normalizeEntry(entry)
    const bundled = BUNDLED[id]
    if (bundled) {
      plugins.push(bundled(config))
      continue
    }

    const modulePath = isAbsolute(id) ? id : resolve(baseDir, id)
    const mod: unknown = await import(pathToFileURL(modulePath).href)
    const exported = (mod as { default?: unknown }).default ?? mod
    const candidate =
      typeof exported === 'function' ? (exported as PluginFactory)(config) : exported

    if (!isMdPlugin(candidate)) {
      throw new Error(`${INVALID_PLUGIN_PREFIX}${id}`)
    }
    plugins.push(candidate)
  }

  return plugins
}
