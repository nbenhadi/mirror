import { readConfig } from '@nbenhadi/mirror-config'
import type { ToolResult } from '@nbenhadi/mirror-core'
import { findField, isProtected, EDITABLE_FIELDS } from '../fields.js'
import { getByPath, setByPath } from '../path-util.js'
import type { ConfigInput } from '../schema.js'
import type { GetOutput } from '../types.js'

type GetInput = Extract<ConfigInput, { action: 'get' }>

export async function get(input: GetInput): Promise<ToolResult<GetOutput>> {
  const config = await readConfig()

  if (input.key === undefined) {
    const nested: Record<string, unknown> = {}
    for (const field of EDITABLE_FIELDS) {
      const stored = getByPath(config, field.key)
      setByPath(nested, field.key, stored ?? field.default ?? '')
    }
    return { success: true, data: { key: undefined, value: nested } }
  }

  if (isProtected(input.key)) {
    return {
      success: false,
      error: {
        code: 'FORBIDDEN',
        message: 'tool.settings.error.protected',
        params: { key: input.key },
      },
    }
  }

  const field = findField(input.key)
  if (!field) {
    return {
      success: false,
      error: {
        code: 'NOT_FOUND',
        message: 'tool.settings.error.unknown_key',
        params: { key: input.key },
      },
    }
  }

  const value = getByPath(config, input.key) ?? field.default ?? ''
  return { success: true, data: { key: input.key, value } }
}
