import type { Tool } from '@nbenhadi/mirror-core'
import { schema } from './schema.js'
import { execute } from './execute.js'
import type { PasswordInput } from './schema.js'

export const passwordTool: Tool<PasswordInput, { password: string }> = {
  id: 'password',
  description: 'Generates a cryptographically secure random password',
  schema,
  execute,
}
