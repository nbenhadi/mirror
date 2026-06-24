import { readConfig } from '@nbenhadi/mirror-config'
import type { ToolResult } from '@nbenhadi/mirror-core'
import { EDITABLE_FIELDS, findField, isProtected } from '../fields.js'
import { getByPath } from '../path-util.js'
import type { ConfigInput } from '../schema.js'
import type { GetOutput } from '../types.js'

type GetInput = Extract<ConfigInput, { action: 'get' }>

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

export async function get(input: GetInput): Promise<ToolResult<GetOutput>> {
  const config = await readConfig()

  if (input.key === undefined) {
    const value: Record<string, unknown> = {}
    for (const field of EDITABLE_FIELDS) {
      const stored = getByPath(config, field.key)
      const fieldValue = stored ?? field.default
      if (fieldValue !== undefined) {
        setByPath(value, field.key, fieldValue)
      }
    }
    return { success: true, data: { key: input.key, value } }
  }

  if (isProtected(input.key)) {
    return {
      success: false,
      error: {
        code: 'FORBIDDEN',
        message: `${input.key} is a protected field and cannot be read`,
      },
    }
  }

  const field = findField(input.key)
  if (!field) {
    return {
      success: false,
      error: { code: 'NOT_FOUND', message: `Unknown config key: ${input.key}` },
    }
  }

  const value = getByPath(config, input.key) ?? field.default
  return { success: true, data: { key: input.key, value } }
}
