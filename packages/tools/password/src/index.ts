import type { Tool } from '@nbenhadi/mirror-core'
import { t } from '@nbenhadi/mirror-i18n'
import { schema } from './schema.js'
import { execute } from './execute.js'
import type { PasswordInput } from './schema.js'

export const passwordTool: Tool<PasswordInput, unknown> = {
  id: 'password',
  description: t('cmd.password.description'),
  schema,
  execute,
}

export type { CheckResult, StrengthLabel, WarningCode, Severity } from './actions/check.js'
export type { PassphraseResult } from './actions/passphrase.js'
export type { PasswordInput, GenerateInput, CheckInput, PassphraseInput } from './schema.js'
export { STRENGTH_KEYS, WARNING_KEYS } from './labels.js'
