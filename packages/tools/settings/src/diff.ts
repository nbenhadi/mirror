import { readConfig } from '@nbenhadi/mirror-config'
import { EDITABLE_FIELDS, type FieldDef } from './fields.js'
import { getByPath } from './path-util.js'
import type { ConfigDiffEntry } from './types.js'

export interface ResetDiff {
  changes: ConfigDiffEntry[]
  hasChanges: boolean
}

export function resettableFields(key?: string): FieldDef[] {
  if (key === undefined) return EDITABLE_FIELDS.filter((f) => f.default !== undefined)
  const field = EDITABLE_FIELDS.find((f) => f.key === key && f.default !== undefined)
  return field ? [field] : []
}

export async function computeResetDiff(fields: FieldDef[]): Promise<ResetDiff> {
  const config = await readConfig()
  const changes = fields
    .map((field) => ({
      key: field.key,
      before: getByPath(config, field.key) ?? field.default,
      after: field.default,
    }))
    .filter((entry) => entry.before !== entry.after)

  return { changes, hasChanges: changes.length > 0 }
}
