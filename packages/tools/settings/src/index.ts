import type { Tool } from '@nbenhadi/mirror-core'
import { t, TranslationKey } from '@nbenhadi/mirror-i18n'
import { schema, type ConfigInput } from './schema.js'
import { execute } from './execute.js'
import type { ConfigOutput } from './types.js'

export const settingsTool: Tool<ConfigInput, ConfigOutput> = {
  id: 'settings',
  description: t('cmd.settings.description' as TranslationKey),
  schema,
  execute: (input) => execute(input),
}

export type { ConfigInput } from './schema.js'
export * from './types.js'
export { EDITABLE_FIELDS, PROTECTED_PREFIXES, isProtected, findField } from './fields.js'
