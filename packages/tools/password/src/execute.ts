import type { ToolContext, ToolResult } from '@nbenhadi/mirror-core'
import type { PasswordInput } from './schema.js'
import { generate } from './actions/generate.js'
import { check } from './actions/check.js'
import { passphrase } from './actions/passphrase.js'

export async function execute(
  input: PasswordInput,
  ctx: ToolContext
): Promise<ToolResult<unknown>> {
  switch (input.action) {
    case 'generate':
      return generate(input, ctx)
    case 'check':
      return check(input, ctx)
    case 'passphrase':
      return passphrase(input, ctx)
  }
}
