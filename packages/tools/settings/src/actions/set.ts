import { readConfig, patchConfig } from '@nbenhadi/mirror-config'
import type { ToolResult } from '@nbenhadi/mirror-core'
import { findField, isProtected, SUPPORTED_LOCALES } from '../fields.js'
import { getByPath, buildPatch } from '../path-util.js'
import type { ConfigInput } from '../schema.js'
import type { SetOutput } from '../types.js'

type SetInput = Extract<ConfigInput, { action: 'set' }>

function validateValueForKey(key: string, value: string): string | null {
  if (key === 'general.lang') {
    if (!(SUPPORTED_LOCALES as readonly string[]).includes(value)) {
      return `value must be one of: ${SUPPORTED_LOCALES.join(', ')}`
    }
  }
  return null
}

export async function set(input: SetInput): Promise<ToolResult<SetOutput>> {
  if (isProtected(input.key)) {
    return {
      success: false,
      error: {
        code: 'FORBIDDEN',
        message: `${input.key} is a protected field and cannot be modified directly`,
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

  let error = field.validate(input.value)
  if (error) {
    return {
      success: false,
      error: { code: 'VALIDATION_ERROR', message: `${input.key}: ${error}` },
    }
  }

  error = validateValueForKey(input.key, input.value)
  if (error) {
    return {
      success: false,
      error: { code: 'VALIDATION_ERROR', message: `${input.key}: ${error}` },
    }
  }

  const config = await readConfig()
  const before = getByPath(config, input.key)
  await patchConfig(buildPatch(input.key, input.value))

  return { success: true, data: { key: input.key, before, after: input.value } }
}
