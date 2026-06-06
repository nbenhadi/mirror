import { Command } from 'commander'
import { execute } from '@mirror/core'
import { copyToClipboard } from '../clipboard.js'
import { promptPassword, promptConfirm } from '../prompt.js'

function fail(code: string, message: string): never {
  console.error(`Error [${code}]: ${message}`)
  process.exit(1)
}

async function autoUnlock(): Promise<void> {
  const masterPassword = await promptPassword('Master password: ')
  const result = await execute({
    toolId: 'vault',
    input: { action: 'unlock', masterPassword, minutes: 30 },
  })
  if (!result.success) fail(result.error.code, result.error.message)
}

async function vaultExecute<T>(input: unknown): Promise<T> {
  let result = await execute({ toolId: 'vault', input })
  if (!result.success && result.error.code === 'UNAUTHORIZED') {
    await autoUnlock()
    result = await execute({ toolId: 'vault', input })
  }
  if (!result.success) fail(result.error.code, result.error.message)
  return result.data as T
}

function fmt(label: string, value: string) {
  console.log(`  ${label.padEnd(12)}${value}`)
}

export const vaultCommand = new Command('vault').description('Encrypted vault management')

vaultCommand
  .command('init')
  .description('Initialize a new vault')
  .option('-p, --path <path>', 'Custom vault file path')
  .action(async (options: { path?: string }) => {
    const masterPassword = await promptPassword('Master password: ')
    const confirm = await promptPassword('Confirm password: ')

    if (masterPassword !== confirm) {
      console.error('Passwords do not match')
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

    if (!result.success) fail(result.error.code, result.error.message)
    const data = result.data as { path: string }
    console.log(`Vault created at ${data.path}`)
  })

vaultCommand
  .command('unlock [minutes]')
  .description('Unlock vault (default: 30 minutes)')
  .action(async (minutes?: string) => {
    const masterPassword = await promptPassword('Master password: ')

    const result = await execute({
      toolId: 'vault',
      input: { action: 'unlock', masterPassword, minutes: parseInt(minutes ?? '30', 10) },
    })

    if (!result.success) fail(result.error.code, result.error.message)
    const data = result.data as { expiresAt: string }
    console.log(`Vault unlocked until ${data.expiresAt}`)
  })

vaultCommand
  .command('lock')
  .description('Lock vault immediately')
  .action(async () => {
    const result = await execute({ toolId: 'vault', input: { action: 'lock' } })
    if (!result.success) fail(result.error.code, result.error.message)
    console.log('Vault locked')
  })

vaultCommand
  .command('path [newPath]')
  .description('Show or set vault file path')
  .action(async (newPath?: string) => {
    const result = await execute({
      toolId: 'vault',
      input: { action: 'path', ...(newPath !== undefined && { newPath }) },
    })
    if (!result.success) fail(result.error.code, result.error.message)
    const data = result.data as { path: string }
    console.log(data.path)
  })

vaultCommand
  .command('add')
  .description('Add a new entry')
  .requiredOption('-t, --title <title>', 'Entry title')
  .option('-u, --username <username>', 'Username or email')
  .option('-p, --password <password>', 'Password')
  .option('--url <url>', 'Website URL')
  .option('-n, --notes <notes>', 'Notes')
  .option('--tags <tags>', 'Comma-separated tags')
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

      const data = await vaultExecute<{ id: string }>({
        action: 'add',
        title: options.title,
        tags,
        ...(options.password !== undefined && { password: options.password }),
        ...(options.username !== undefined && { username: options.username }),
        ...(options.url !== undefined && { url: options.url }),
        ...(options.notes !== undefined && { notes: options.notes }),
      })

      console.log(`Entry added (${data.id})`)
    }
  )

vaultCommand
  .command('list')
  .description('List entries')
  .option('-s, --search <query>', 'Filter by title, username or URL')
  .option('--tag <tag>', 'Filter by tag')
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
      console.log('No entries')
      return
    }

    const titleW = Math.max(5, ...entries.map((e) => e.title.length))
    const userW = Math.max(8, ...entries.map((e) => (e.username ?? '').length))
    const urlW = Math.max(3, ...entries.map((e) => (e.url ?? '').length))

    console.log(
      `\n  ${'TITLE'.padEnd(titleW)}  ${'USERNAME'.padEnd(userW)}  ${'URL'.padEnd(urlW)}  TAGS`
    )
    console.log(`  ${'─'.repeat(titleW + userW + urlW + 20)}`)

    for (const e of entries) {
      const tags = e.tags.length ? e.tags.join(', ') : ''
      console.log(
        `  ${e.title.padEnd(titleW)}  ${(e.username ?? '').padEnd(userW)}  ${(e.url ?? '').padEnd(urlW)}  ${tags}`
      )
    }

    console.log(`\n  ${count} entr${count === 1 ? 'y' : 'ies'}`)
  })

vaultCommand
  .command('get <title>')
  .description('Get an entry — copies password to clipboard')
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
    fmt('Title:', e.title)
    if (e.username) fmt('Username:', e.username)
    if (e.url) fmt('URL:', e.url)
    if (e.notes) fmt('Notes:', e.notes)
    if (e.tags.length) fmt('Tags:', e.tags.join(', '))
    fmt('Created:', e.created_at)
    fmt('Updated:', e.updated_at)
    console.log()

    if (e.password) {
      copyToClipboard(e.password)
    }
  })

vaultCommand
  .command('edit <title>')
  .description('Edit an existing entry')
  .option('--new-title <title>', 'Rename entry')
  .option('-u, --username <username>', 'New username')
  .option('-p, --password <password>', 'New password')
  .option('--url <url>', 'New URL')
  .option('-n, --notes <notes>', 'New notes')
  .option('--tags <tags>', 'New tags (comma-separated)')
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

      console.log(`"${data.title}" updated`)
    }
  )

vaultCommand
  .command('delete <title>')
  .description('Move entry to trash (use --force to skip trash)')
  .option('-f, --force', 'Permanently delete without going through trash', false)
  .action(async (title: string, options: { force: boolean }) => {
    const data = await vaultExecute<{ title: string; permanent: boolean }>({
      action: 'delete',
      title,
      force: options.force,
    })
    console.log(data.permanent ? `"${title}" permanently deleted` : `"${title}" moved to trash`)
  })

vaultCommand
  .command('restore <title>')
  .description('Restore entry from trash')
  .action(async (title: string) => {
    await vaultExecute({ action: 'restore', title })
    console.log(`"${title}" restored`)
  })

vaultCommand
  .command('trash')
  .description('List entries in trash')
  .action(async () => {
    const { entries, count } = await vaultExecute<{
      entries: { title: string; username?: string; deleted_at: string }[]
      count: number
    }>({ action: 'trash' })

    if (count === 0) {
      console.log('Trash is empty')
      return
    }

    console.log(`\n  ${'TITLE'.padEnd(30)}  DELETED AT`)
    console.log(`  ${'─'.repeat(50)}`)
    for (const e of entries) {
      console.log(`  ${e.title.padEnd(30)}  ${e.deleted_at}`)
    }
    console.log(`\n  ${count} entr${count === 1 ? 'y' : 'ies'} in trash`)
  })

vaultCommand
  .command('rekey')
  .description('Change master password and re-encrypt vault')
  .action(async () => {
    const currentPassword = await promptPassword('Current master password: ')
    const newPassword = await promptPassword('New master password: ')
    const confirm = await promptPassword('Confirm new password: ')

    if (newPassword !== confirm) {
      console.error('Passwords do not match')
      process.exit(1)
    }

    const data = await vaultExecute<{ message: string }>({
      action: 'rekey',
      currentPassword,
      newPassword,
    })
    console.log(data.message)
  })

vaultCommand
  .command('purge [title]')
  .description('Permanently delete from trash — one entry or all if no title given')
  .option('-y, --yes', 'Skip confirmation', false)
  .action(async (title: string | undefined, options: { yes: boolean }) => {
    if (title === undefined && !options.yes) {
      const confirmed = await promptConfirm('Permanently delete all trash entries?')
      if (!confirmed) {
        console.log('Cancelled')
        return
      }
    }

    const data = await vaultExecute<{ title?: string; count?: number }>({
      action: 'purge',
      ...(title !== undefined && { title }),
    })
    if (data.title !== undefined) {
      console.log(`"${data.title}" permanently deleted`)
    } else {
      const n = data.count ?? 0
      console.log(
        n === 0 ? 'Trash already empty' : `${n} entr${n === 1 ? 'y' : 'ies'} permanently deleted`
      )
    }
  })
