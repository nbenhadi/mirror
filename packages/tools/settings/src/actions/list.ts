import { readConfig } from '@nbenhadi/mirror-config'
import type { ToolResult } from '@nbenhadi/mirror-core'
import { EDITABLE_FIELDS } from '../fields.js'
import { getByPath, setByPath } from '../path-util.js'
import type { ListOutput } from '../types.js'

export async function list(): Promise<ToolResult<ListOutput>> {
  const config = await readConfig()
  const nested: Record<string, unknown> = {}

  for (const field of EDITABLE_FIELDS) {
    const stored = getByPath(config, field.key)
    setByPath(nested, field.key, stored ?? field.default ?? '')
  }

  return { success: true, data: { action: 'list', settings: nested } }
}
