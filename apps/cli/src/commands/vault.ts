import { Command } from 'commander'
import { execute } from '@nbenhadi/mirror-core'
import { t } from '@nbenhadi/mirror-i18n'
import { copyToClipboard } from '../clipboard.js'
import { promptPassword, promptConfirm } from '../prompt.js'

function fail(message: string): never {
  console.error(message)
  process.exit(1)
}

function failWithCode(error: { code: string; message: string }): never {
  const map: Record<string, Parameters<typeof t>[0]> = {
    VALIDATION: 'error.validation',
    NOT_FOUND: 'error.not_found',
    UNAUTHORIZED: 'vault.error.invalid_password',
    FORBIDDEN: 'error.forbidden',
    EXECUTION: 'error.execution',
    CRYPTO: 'error.crypto',
    DATABASE: 'error.database',
  }
  const key = map[error.code]
  fail(key ? t(key) : error.message)
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
    if (attempt < MAX_ATTEMPTS) {
      console.error(t('vault.error.invalid_password'))
    } else {
      fail(t('vault.error.invalid_password'))
    }
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

function fmt(label: string, value: string) {
  console.log(`  ${label.padEnd(12)}${value}`)
}

export function createVaultCommand(): Command {
  const cmd = new Command('vault').description(t('cmd.vault.description'))

  cmd
    .command('init')
    .description(t('cmd.vault.init.description'))
    .option('-p, --path <path>', t('cmd.vault.init.opt.path'))
    .action(async (options: { path?: string }) => {
      const masterPassword = await promptPassword(t('prompt.master_password'))
      const confirm = await promptPassword(t('prompt.confirm_password'))

      if (masterPassword !== confirm) {
        console.error(t('cli.passwords_mismatch'))
        process.exit(1)
      }

      const result = await execute({
        toolId: 'vault',
        input: {
          action: 'init',
          masterPassword,
          ...(options.path !== undefined && { path: options.path }),
        },
      })

      if (!result.success) failWithCode(result.error)
      const data = result.data as { path: string }
      console.log(t('vault.init.success', { path: data.path }))
    })

  cmd
    .command('unlock [minutes]')
    .description(t('cmd.vault.unlock.description'))
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
      const data = result.data as { expiresAt: string }
      console.log(t('vault.unlock.success', { expiresAt: data.expiresAt }))
    })

  cmd
    .command('lock')
    .description(t('cmd.vault.lock.description'))
    .action(async () => {
      const result = await execute({ toolId: 'vault', input: { action: 'lock' } })
      if (!result.success) failWithCode(result.error)
      console.log(t('vault.lock.success'))
    })

  cmd
    .command('path [newPath]')
    .description(t('cmd.vault.path.description'))
    .action(async (newPath?: string) => {
      const result = await execute({
        toolId: 'vault',
        input: { action: 'path', ...(newPath !== undefined && { newPath }) },
      })
      if (!result.success) failWithCode(result.error)
      const data = result.data as { path: string }
      console.log(data.path)
    })

  cmd
    .command('add')
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
        const tags = options.tags ? options.tags.split(',').map((tag) => tag.trim()) : []

        await vaultExecute<{ id: string }>({
          action: 'add',
          title: options.title,
          tags,
          ...(options.password !== undefined && { password: options.password }),
          ...(options.username !== undefined && { username: options.username }),
          ...(options.url !== undefined && { url: options.url }),
          ...(options.notes !== undefined && { notes: options.notes }),
        })

        console.log(t('vault.add.success'))
      }
    )

  cmd
    .command('list')
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
        console.log(t('vault.list.empty'))
        return
      }

      const titleW = Math.max(5, ...entries.map((e) => e.title.length))
      const userW = Math.max(8, ...entries.map((e) => (e.username ?? '').length))
      const urlW = Math.max(3, ...entries.map((e) => (e.url ?? '').length))

      const colTitle = t('table.title').padEnd(titleW)
      const colUser = t('table.username').padEnd(userW)
      const colUrl = t('table.url').padEnd(urlW)

      const headerWidth = titleW + userW + urlW + 20
      const termWidth = process.stdout.columns ?? 80
      console.log(`\n  ${colTitle}  ${colUser}  ${colUrl}  ${t('table.tags')}`)
      console.log(`  ${'-'.repeat(Math.min(headerWidth, termWidth - 2))}`)

      for (const e of entries) {
        const tags = e.tags.length ? e.tags.join(', ') : ''
        console.log(
          `  ${e.title.padEnd(titleW)}  ${(e.username ?? '').padEnd(userW)}  ${(e.url ?? '').padEnd(urlW)}  ${tags}`
        )
      }

      console.log(
        `\n  ${count === 1 ? t('vault.list.count_one') : t('vault.list.count_many', { n: count })}`
      )
    })

  cmd
    .command('get <title>')
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

      console.log()
      fmt(t('table.title') + ':', e.title)
      if (e.username) fmt(t('table.username') + ':', e.username)
      if (e.url) fmt(t('table.url') + ':', e.url)
      if (e.notes) fmt(t('table.notes') + ':', e.notes)
      if (e.tags.length) fmt(t('table.tags') + ':', e.tags.join(', '))
      fmt(t('table.created_at') + ':', e.created_at)
      fmt(t('table.updated_at') + ':', e.updated_at)
      console.log()

      if (e.password) {
        copyToClipboard(e.password)
      }
    })

  cmd
    .command('edit <title>')
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
        const tags = options.tags ? options.tags.split(',').map((tag) => tag.trim()) : undefined

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

        console.log(t('vault.edit.success', { title: data.title }))
      }
    )

  cmd
    .command('delete <title>')
    .description(t('cmd.vault.delete.description'))
    .option('-f, --force', t('cmd.vault.delete.opt.force'), false)
    .action(async (title: string, options: { force: boolean }) => {
      const data = await vaultExecute<{ title: string; permanent: boolean }>({
        action: 'delete',
        title,
        force: options.force,
      })
      console.log(
        data.permanent
          ? t('vault.delete.permanent', { title })
          : t('vault.delete.trashed', { title })
      )
    })

  cmd
    .command('restore <title>')
    .description(t('cmd.vault.restore.description'))
    .action(async (title: string) => {
      await vaultExecute({ action: 'restore', title })
      console.log(t('vault.restore.success', { title }))
    })

  cmd
    .command('trash')
    .description(t('cmd.vault.trash.description'))
    .action(async () => {
      const { entries, count } = await vaultExecute<{
        entries: { title: string; username?: string; deleted_at: string }[]
        count: number
      }>({ action: 'trash' })

      if (count === 0) {
        console.log(t('vault.trash.empty'))
        return
      }

      console.log(`\n  ${t('table.title').padEnd(30)}  ${t('table.deleted_at')}`)
      console.log(`  ${'-'.repeat(50)}`)
      for (const e of entries) {
        console.log(`  ${e.title.padEnd(30)}  ${e.deleted_at}`)
      }
      console.log(
        `\n  ${count === 1 ? t('vault.trash.count_one') : t('vault.trash.count_many', { n: count })}`
      )
    })

  cmd
    .command('rekey')
    .description(t('cmd.vault.rekey.description'))
    .action(async () => {
      const currentPassword = await promptPassword(t('prompt.current_password'))
      const newPassword = await promptPassword(t('prompt.new_password'))
      const confirm = await promptPassword(t('prompt.confirm_new_password'))

      if (newPassword !== confirm) {
        console.error(t('cli.passwords_mismatch'))
        process.exit(1)
      }

      await vaultExecute<{ message: string }>({
        action: 'rekey',
        currentPassword,
        newPassword,
      })
      console.log(t('vault.rekey.success'))
    })

  cmd
    .command('purge [title]')
    .description(t('cmd.vault.purge.description'))
    .option('-y, --yes', t('cmd.vault.purge.opt.yes'), false)
    .action(async (title: string | undefined, options: { yes: boolean }) => {
      if (title === undefined && !options.yes) {
        const confirmed = await promptConfirm(t('prompt.purge_all_confirm'))
        if (!confirmed) {
          console.log(t('cli.cancelled'))
          return
        }
      }

      const data = await vaultExecute<{ title?: string; count?: number }>({
        action: 'purge',
        ...(title !== undefined && { title }),
      })

      if (data.title !== undefined) {
        console.log(t('vault.purge.success', { title: data.title }))
      } else {
        const n = data.count ?? 0
        if (n === 0) {
          console.log(t('vault.purge.already_empty'))
        } else {
          console.log(n === 1 ? t('vault.purge.all_one') : t('vault.purge.all_many', { n }))
        }
      }
    })

  return cmd
}
