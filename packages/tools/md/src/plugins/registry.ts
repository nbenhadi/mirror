import { pathToFileURL } from 'node:url'
import { resolve, isAbsolute } from 'node:path'
import type { MdPlugin } from './types.js'
import type { PluginEntry } from '../engine/parse.js'
import { createTocPlugin } from './toc.js'
import { createGlossaryPlugin } from './glossary.js'

type PluginFactory = () => MdPlugin

const BUNDLED: Record<string, PluginFactory> = {
  toc: createTocPlugin,
  glossary: createGlossaryPlugin,
}

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

export async function loadPlugins(entries: PluginEntry[], baseDir: string): Promise<MdPlugin[]> {
  const plugins: MdPlugin[] = []

  for (const id of entries) {
    const bundled = BUNDLED[id]
    if (bundled) {
      plugins.push(bundled())
      continue
    }

    const modulePath = isAbsolute(id) ? id : resolve(baseDir, id)
    const mod: unknown = await import(pathToFileURL(modulePath).href)
    const exported = (mod as { default?: unknown }).default ?? mod
    const candidate = typeof exported === 'function' ? (exported as PluginFactory)() : exported

    if (!isMdPlugin(candidate)) {
      throw new Error(`${INVALID_PLUGIN_PREFIX}${id}`)
    }
    plugins.push(candidate)
  }

  return plugins
}
