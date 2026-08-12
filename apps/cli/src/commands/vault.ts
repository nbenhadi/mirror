import { Command } from 'commander'
import { execute, type ToolError } from '@nbenhadi/mirror-core'
import { t } from '@nbenhadi/mirror-i18n'
import { copyToClipboard } from '../utils/clipboard.js'
import { promptPassword, promptConfirm } from '../utils/prompt.js'
import * as ui from '../utils/ui.js'

function failWithCode(error: ToolError): never {
  ui.fatal(t(error.message, error.params))
}

async function autoUnlock(): Promise<void> {
  const MAX_ATTEMPTS = 3
  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
    const masterPassword = await promptPassword(t('prompt.master_password'))
    const result = await execute({
      toolId: 'vault',
      input: { action: 'unlock', masterPassword, minutes: 30 },
    })
    if (result.success) return
    if (attempt < MAX_ATTEMPTS) ui.printError(t('cmd.vault.error.invalid_password'))
    else ui.fatal(t('cmd.vault.error.invalid_password'))
  }
}

async function vaultExecute<T>(input: unknown): Promise<T> {
  let result = await execute({ toolId: 'vault', input })
  if (!result.success && result.error.code === 'UNAUTHORIZED') {
    await autoUnlock()
    result = await execute({ toolId: 'vault', input })
  }
  if (!result.success) failWithCode(result.error)
  return result.data as T
}

function createInitCommand(): Command {
  return new Command('init')
    .description(t('cmd.vault.init.description'))
    .option('-p, --path <path>', t('cmd.vault.init.opt.path'))
    .action(async (options: { path?: string }) => {
      const masterPassword = await promptPassword(t('prompt.master_password'))
      const confirm = await promptPassword(t('prompt.confirm_password'))
      if (masterPassword !== confirm) ui.fatal(t('cli.passwords_mismatch'))

      const result = await execute({
        toolId: 'vault',
        input: {
          action: 'init',
          masterPassword,
          ...(options.path !== undefined && { path: options.path }),
        },
      })
      if (!result.success) failWithCode(result.error)
      ui.printSuccess(t('cmd.vault.init.success', { path: (result.data as { path: string }).path }))
    })
}

function createUnlockCommand(): Command {
  return new Command('unlock [minutes]')
    .description(t('cmd.vault.unlock.description', { minutes: 30 }))
    .action(async (minutes?: string) => {
      const masterPassword = await promptPassword(t('prompt.master_password'))
      const result = await execute({
        toolId: 'vault',
        input: {
          action: 'unlock',
          masterPassword,
          minutes: Math.min(parseInt(minutes ?? '30', 10), 1440),
        },
      })
      if (!result.success) failWithCode(result.error)
      ui.printSuccess(
        t('cmd.vault.unlock.success', {
          expiresAt: (result.data as { expiresAt: string }).expiresAt,
        })
      )
    })
}

function createLockCommand(): Command {
  return new Command('lock').description(t('cmd.vault.lock.description')).action(async () => {
    const result = await execute({ toolId: 'vault', input: { action: 'lock' } })
    if (!result.success) failWithCode(result.error)
    ui.printSuccess(t('cmd.vault.lock.success'))
  })
}

function createPathCommand(): Command {
  return new Command('path [newPath]')
    .description(t('cmd.vault.path.description'))
    .action(async (newPath?: string) => {
      const result = await execute({
        toolId: 'vault',
        input: { action: 'path', ...(newPath !== undefined && { newPath }) },
      })
      if (!result.success) failWithCode(result.error)
      console.log((result.data as { path: string }).path)
    })
}

function createAddCommand(): Command {
  return new Command('add')
    .description(t('cmd.vault.add.description'))
    .requiredOption('-t, --title <title>', t('cmd.vault.add.opt.title'))
    .option('-u, --username <username>', t('cmd.vault.add.opt.username'))
    .option('-p, --password <password>', t('cmd.vault.add.opt.password'))
    .option('--url <url>', t('cmd.vault.add.opt.url'))
    .option('-n, --notes <notes>', t('cmd.vault.add.opt.notes'))
    .option('--tags <tags>', t('cmd.vault.add.opt.tags'))
    .action(
      async (options: {
        title: string
        username?: string
        password?: string
        url?: string
        notes?: string
        tags?: string
      }) => {
        const tags = options.tags ? options.tags.split(',').map((t) => t.trim()) : []
        await vaultExecute<{ id: string }>({
          action: 'add',
          title: options.title,
          tags,
          ...(options.password !== undefined && { password: options.password }),
          ...(options.username !== undefined && { username: options.username }),
          ...(options.url !== undefined && { url: options.url }),
          ...(options.notes !== undefined && { notes: options.notes }),
        })
        ui.printSuccess(t('cmd.vault.add.success'))
      }
    )
}

function createListCommand(): Command {
  return new Command('list')
    .description(t('cmd.vault.list.description'))
    .option('-s, --search <query>', t('cmd.vault.list.opt.search'))
    .option('--tag <tag>', t('cmd.vault.list.opt.tag'))
    .action(async (options: { search?: string; tag?: string }) => {
      const { entries, count } = await vaultExecute<{
        entries: { title: string; username?: string; url?: string; tags: string[] }[]
        count: number
      }>({
        action: 'list',
        ...(options.search !== undefined && { search: options.search }),
        ...(options.tag !== undefined && { tag: options.tag }),
      })

      if (count === 0) {
        console.log(t('cmd.vault.list.empty'))
        return
      }

      const rows = entries.map((e) => [e.title, e.username ?? '', e.url ?? '', e.tags.join(', ')])
      ui.table([t('title'), t('username'), t('url'), t('tags')], rows)
      console.log()
      ui.hint(
        count === 1 ? t('cmd.vault.list.count_one') : t('cmd.vault.list.count_many', { n: count })
      )
    })
}

function createGetCommand(): Command {
  return new Command('get <title>')
    .description(t('cmd.vault.get.description'))
    .action(async (title: string) => {
      const e = await vaultExecute<{
        title: string
        username?: string
        password?: string
        url?: string
        notes?: string
        tags: string[]
        created_at: string
        updated_at: string
      }>({ action: 'get', title, showPassword: true })

      const lbls = [
        t('title'),
        t('username'),
        t('url'),
        t('notes'),
        t('tags'),
        t('created_at'),
        t('updated_at'),
      ]
      const labelW = Math.max(...lbls.map((l) => l.length)) + 3

      console.log()
      ui.row(t('title'), e.title, labelW)
      if (e.username) ui.row(t('username'), e.username, labelW)
      if (e.url) ui.row(t('url'), e.url, labelW)
      if (e.notes) ui.row(t('notes'), e.notes, labelW)
      if (e.tags.length) ui.row(t('tags'), e.tags.join(', '), labelW)
      ui.row(t('created_at'), e.created_at, labelW)
      ui.row(t('updated_at'), e.updated_at, labelW)
      console.log()

      if (e.password) copyToClipboard(e.password)
    })
}

function createEditCommand(): Command {
  return new Command('edit <title>')
    .description(t('cmd.vault.edit.description'))
    .option('--new-title <title>', t('cmd.vault.edit.opt.new_title'))
    .option('-u, --username <username>', t('cmd.vault.edit.opt.username'))
    .option('-p, --password <password>', t('cmd.vault.edit.opt.password'))
    .option('--url <url>', t('cmd.vault.edit.opt.url'))
    .option('-n, --notes <notes>', t('cmd.vault.edit.opt.notes'))
    .option('--tags <tags>', t('cmd.vault.edit.opt.tags'))
    .action(
      async (
        title: string,
        options: {
          newTitle?: string
          username?: string
          password?: string
          url?: string
          notes?: string
          tags?: string
        }
      ) => {
        const tags = options.tags ? options.tags.split(',').map((t) => t.trim()) : undefined
        const data = await vaultExecute<{ title: string }>({
          action: 'edit',
          title,
          ...(options.newTitle !== undefined && { newTitle: options.newTitle }),
          ...(options.username !== undefined && { username: options.username }),
          ...(options.password !== undefined && { password: options.password }),
          ...(options.url !== undefined && { url: options.url }),
          ...(options.notes !== undefined && { notes: options.notes }),
          ...(tags !== undefined && { tags }),
        })
        ui.printSuccess(t('cmd.vault.edit.success', { title: data.title }))
      }
    )
}

function createDeleteCommand(): Command {
  return new Command('delete <title>')
    .description(t('cmd.vault.delete.description'))
    .option('-f, --force', t('cmd.vault.delete.opt.force'), false)
    .action(async (title: string, options: { force: boolean }) => {
      const data = await vaultExecute<{ title: string; permanent: boolean }>({
        action: 'delete',
        title,
        force: options.force,
      })
      ui.printSuccess(
        data.permanent
          ? t('cmd.vault.delete.permanent', { title })
          : t('cmd.vault.delete.trashed', { title })
      )
    })
}

function createRestoreCommand(): Command {
  return new Command('restore <title>')
    .description(t('cmd.vault.restore.description'))
    .action(async (title: string) => {
      await vaultExecute({ action: 'restore', title })
      ui.printSuccess(t('cmd.vault.restore.success', { title }))
    })
}

function createTrashCommand(): Command {
  return new Command('trash').description(t('cmd.vault.trash.description')).action(async () => {
    const { entries, count } = await vaultExecute<{
      entries: { title: string; username?: string; deleted_at: string }[]
      count: number
    }>({ action: 'trash' })

    if (count === 0) {
      console.log(t('cmd.vault.trash.empty'))
      return
    }

    const rows = entries.map((e) => [e.title, e.deleted_at])
    ui.table([t('title'), t('deleted_at')], rows)
    console.log()
    ui.hint(
      count === 1 ? t('cmd.vault.trash.count_one') : t('cmd.vault.trash.count_many', { n: count })
    )
  })
}

function createRekeyCommand(): Command {
  return new Command('rekey').description(t('cmd.vault.rekey.description')).action(async () => {
    const currentPassword = await promptPassword(t('prompt.current_password'))
    const newPassword = await promptPassword(t('prompt.new_password'))
    const confirm = await promptPassword(t('prompt.confirm_new_password'))
    if (newPassword !== confirm) ui.fatal(t('cli.passwords_mismatch'))
    await vaultExecute<{ message: string }>({ action: 'rekey', currentPassword, newPassword })
    ui.printSuccess(t('cmd.vault.rekey.success'))
  })
}

function createPurgeCommand(): Command {
  return new Command('purge [title]')
    .description(t('cmd.vault.purge.description'))
    .option('-y, --yes', t('cmd.vault.purge.opt.yes'), false)
    .action(async (title: string | undefined, options: { yes: boolean }) => {
      if (title === undefined && !options.yes) {
        const confirmed = await promptConfirm(t('cmd.vault.purge.all_confirm'))
        if (!confirmed) {
          ui.hint(t('cancelled'))
          return
        }
      }

      const data = await vaultExecute<{ title?: string; count?: number }>({
        action: 'purge',
        ...(title !== undefined && { title }),
      })

      if (data.title !== undefined) {
        ui.printSuccess(t('cmd.vault.purge.success', { title: data.title }))
      } else {
        const n = data.count ?? 0
        if (n === 0) ui.hint(t('cmd.vault.purge.already_empty'))
        else
          ui.printSuccess(
            n === 1 ? t('cmd.vault.purge.all_one') : t('cmd.vault.purge.all_many', { n })
          )
      }
    })
}

export function createVaultCommand(): Command {
  const cmd = new Command('vault').description(t('cmd.vault.description'))
  cmd.addCommand(createInitCommand())
  cmd.addCommand(createUnlockCommand())
  cmd.addCommand(createLockCommand())
  cmd.addCommand(createPathCommand())
  cmd.addCommand(createAddCommand())
  cmd.addCommand(createListCommand())
  cmd.addCommand(createGetCommand())
  cmd.addCommand(createEditCommand())
  cmd.addCommand(createDeleteCommand())
  cmd.addCommand(createRestoreCommand())
  cmd.addCommand(createTrashCommand())
  cmd.addCommand(createRekeyCommand())
  cmd.addCommand(createPurgeCommand())
  return cmd
}
