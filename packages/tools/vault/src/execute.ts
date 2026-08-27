import type { ToolContext, ToolResult } from '@nbenhadi/mirror-core'
import type { VaultInput } from './schema.js'
import { init } from './actions/init.js'
import { unlock } from './actions/unlock.js'
import { lock } from './actions/lock.js'
import { path } from './actions/path.js'
import { add } from './actions/add.js'
import { list } from './actions/list.js'
import { get } from './actions/get.js'
import { edit } from './actions/edit.js'
import { deleteEntry } from './actions/delete.js'
import { restore } from './actions/restore.js'
import { trash } from './actions/trash.js'
import { purge } from './actions/purge.js'
import { rekey } from './actions/rekey.js'
import { tagAdd } from './actions/tag/add.js'
import { tagList } from './actions/tag/list.js'
import { tagEdit } from './actions/tag/edit.js'
import { tagDelete } from './actions/tag/delete.js'

export async function execute(input: VaultInput, ctx: ToolContext): Promise<ToolResult<unknown>> {
  switch (input.action) {
    case 'init':
      return init(input, ctx)
    case 'unlock':
      return unlock(input, ctx)
    case 'lock':
      return lock(input, ctx)
    case 'path':
      return path(input, ctx)
    case 'add':
      return add(input, ctx)
    case 'list':
      return list(input, ctx)
    case 'get':
      return get(input, ctx)
    case 'edit':
      return edit(input, ctx)
    case 'delete':
      return deleteEntry(input, ctx)
    case 'restore':
      return restore(input, ctx)
    case 'trash':
      return trash(input, ctx)
    case 'purge':
      return purge(input, ctx)
    case 'rekey':
      return rekey(input, ctx)
    case 'tag.add':
      return tagAdd(input, ctx)
    case 'tag.list':
      return tagList(input, ctx)
    case 'tag.edit':
      return tagEdit(input, ctx)
    case 'tag.delete':
      return tagDelete(input, ctx)
  }
}
