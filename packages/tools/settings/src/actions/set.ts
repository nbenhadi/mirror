import { readConfig, patchConfig } from '@nbenhadi/mirror-config'
import type { ToolResult } from '@nbenhadi/mirror-core'
import { findField, isProtected } from '../fields.js'
import { getByPath, buildPatch } from '../path-util.js'
import type { ConfigInput } from '../schema.js'
import type { SetOutput } from '../types.js'

type SetInput = Extract<ConfigInput, { action: 'set' }>

export async function set(input: SetInput): Promise<ToolResult<SetOutput>> {
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

  const validationError = field.validate(input.value)
  if (validationError) {
    return {
      success: false,
      error: {
        code: 'VALIDATION_ERROR',
        message: 'tool.settings.error.invalid_value',
        params: { key: input.key },
      },
    }
  }

  const config = await readConfig()
  const before = getByPath(config, input.key)
  await patchConfig(buildPatch(input.key, input.value))

  return { success: true, data: { key: input.key, before, after: input.value } }
}
