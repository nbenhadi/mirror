import type { Tool } from '@nbenhadi/mirror-core'
import { t } from '@nbenhadi/mirror-i18n'
import { schema } from './schema.js'
import { execute } from './execute.js'
import type { PasswordInput } from './schema.js'

export const passwordTool: Tool<PasswordInput, { password: string }> = {
  id: 'password',
  description: t('cmd.password.description'),
  schema,
  execute,
}
