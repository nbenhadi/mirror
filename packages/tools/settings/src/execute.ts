import type { ToolResult } from '@nbenhadi/mirror-core'
import type { ConfigInput } from './schema.js'
import type { ConfigOutput } from './types.js'
import { get } from './actions/get.js'
import { set } from './actions/set.js'
import { reset } from './actions/reset.js'
import { list } from './actions/list.js'

export async function execute(input: ConfigInput): Promise<ToolResult<ConfigOutput>> {
  switch (input.action) {
    case 'get':
      return get(input)
    case 'set':
      return set(input)
    case 'reset':
      return reset(input)
    case 'list':
      return list()
  }
}
