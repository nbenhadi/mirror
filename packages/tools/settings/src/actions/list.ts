import { readConfig } from '@nbenhadi/mirror-config'
import type { ToolResult } from '@nbenhadi/mirror-core'
import { EDITABLE_FIELDS } from '../fields.js'
import { getByPath } from '../path-util.js'
import type { ListOutput } from '../types.js'

function setByPath(obj: Record<string, unknown>, path: string, value: unknown): void {
  const parts = path.split('.')
  let cur = obj
  for (let i = 0; i < parts.length - 1; i++) {
    const p = parts[i]!
    if (typeof cur[p] !== 'object' || cur[p] === null) cur[p] = {}
    cur = cur[p] as Record<string, unknown>
  }
  cur[parts[parts.length - 1]!] = value
}

export async function list(): Promise<ToolResult<ListOutput>> {
  const config = await readConfig()
  const nested: Record<string, unknown> = {}

  for (const field of EDITABLE_FIELDS) {
    const stored = getByPath(config, field.key)
    const value = stored ?? field.default
    if (value !== undefined) {
      setByPath(nested, field.key, value)
    }
  }

  return { success: true, data: { action: 'list', settings: nested } }
}
