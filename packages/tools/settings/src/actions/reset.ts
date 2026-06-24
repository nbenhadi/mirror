import { patchConfig, deepMerge } from '@nbenhadi/mirror-config'
import type { ToolResult } from '@nbenhadi/mirror-core'
import { findField, isProtected } from '../fields.js'
import { buildPatch } from '../path-util.js'
import { resettableFields, computeResetDiff } from '../diff.js'
import type { ConfigInput } from '../schema.js'
import type { ResetOutput } from '../types.js'

type ResetInput = Extract<ConfigInput, { action: 'reset' }>

export async function reset(input: ResetInput): Promise<ToolResult<ResetOutput>> {
  const key = input.key === 'all' ? undefined : input.key
  const apply = input.apply !== false

  if (key !== undefined) {
    if (isProtected(key)) {
      return {
        success: false,
        error: {
          code: 'FORBIDDEN',
          message: `${key} is a protected field and cannot be reset`,
        },
      }
    }
    const field = findField(key)
    if (!field) {
      return {
        success: false,
        error: { code: 'NOT_FOUND', message: `Unknown config key: ${key}` },
      }
    }
    if (field.default === undefined) {
      return {
        success: false,
        error: {
          code: 'EXECUTION_ERROR',
          message: `${key} has no default value to reset to`,
        },
      }
    }
  }

  const fields = resettableFields(key)
  const diff = await computeResetDiff(fields)

  let applied = false
  if (diff.hasChanges && apply) {
    let patch: Record<string, unknown> = {}
    for (const change of diff.changes) {
      patch = deepMerge(patch, buildPatch(change.key, change.after))
    }
    await patchConfig(patch)
    applied = true
  }

  return { success: true, data: { action: 'reset', applied, diff } }
}
