import { Command } from 'commander'
import { execute, type ToolError } from '@nbenhadi/mirror-core'
import {
  type GetOutput,
  type SetOutput,
  type ResetOutput,
  type ListOutput,
} from '@nbenhadi/mirror-settings'
import { t } from '@nbenhadi/mirror-i18n'
import chalk from 'chalk'
import { promptConfirm } from '../utils/prompt.js'
import * as ui from '../utils/ui.js'

function fatalFromError(error: ToolError): never {
  ui.fatal(t(error.message, error.params))
}

function flattenSettings(obj: unknown, prefix = ''): Array<{ key: string; value: string }> {
  if (obj !== null && typeof obj === 'object') {
    return Object.entries(obj as Record<string, unknown>).flatMap(([k, v]) =>
      flattenSettings(v, prefix ? `${prefix}.${k}` : k)
    )
  }
  return [{ key: prefix, value: String(obj ?? '') }]
}

function createGetCommand(): Command {
  return new Command('get')
    .description(t('cmd.settings.get.description'))
    .option('-k, --key <value>', t('cmd.settings.get.opt.key'))
    .action(async (options) => {
      const result = await execute<GetOutput>({
        toolId: 'settings',
        input: { action: 'get', key: options.key },
      })
      if (!result.success) fatalFromError(result.error)

      const key = String(result.data.key ?? '')
      const value = String(result.data.value ?? '')
      ui.table([t('key').toUpperCase(), t('value').toUpperCase()], [[key, value]])
      console.log()
    })
}

function createSetCommand(): Command {
  return new Command('set')
    .description(t('cmd.settings.set.description'))
    .option('-k, --key <value>', t('cmd.settings.set.opt.key'))
    .option('-v, --value <value>', t('cmd.settings.set.opt.value'))
    .action(async (options) => {
      const result = await execute<SetOutput>({
        toolId: 'settings',
        input: { action: 'set', key: options.key, value: options.value },
      })
      if (!result.success) fatalFromError(result.error)
      ui.printSuccess(
        t('cmd.settings.set.success', { key: result.data.key, value: result.data.after as string })
      )
    })
}

function createResetCommand(): Command {
  return new Command('reset')
    .description(t('cmd.settings.reset.description'))
    .option('-k, --key <value>', t('cmd.settings.reset.opt.key'))
    .action(async (options) => {
      const key = options.key as string | undefined
      const dryInput =
        key && key !== 'all'
          ? { action: 'reset', key, apply: false }
          : { action: 'reset', apply: false }

      const dryResult = await execute<ResetOutput>({ toolId: 'settings', input: dryInput })
      if (!dryResult.success) fatalFromError(dryResult.error)

      const { changes } = dryResult.data.diff

      if (changes.length === 0) {
        ui.hint(t('cmd.settings.reset.no_changes'))
        return
      }

      const colKey = t('cmd.settings.reset.col.key')
      const colBefore = t('cmd.settings.reset.col.before')
      const colAfter = t('cmd.settings.reset.col.after')

      const rows = changes.map((c) => [
        c.key,
        chalk.red(String(c.before)),
        chalk.green(String(c.after)),
      ])
      ui.table([colKey, colBefore, colAfter], rows)
      console.log()

      const confirmed = await promptConfirm(t('cmd.settings.reset.confirm'))
      if (!confirmed) return

      const applyInput = key && key !== 'all' ? { action: 'reset', key } : { action: 'reset' }

      const result = await execute<ResetOutput>({ toolId: 'settings', input: applyInput })
      if (!result.success) fatalFromError(result.error)
      ui.printSuccess(t('cmd.settings.reset.success'))
    })
}

function createListCommand(): Command {
  return new Command('list').description(t('cmd.settings.list.description')).action(async () => {
    const result = await execute<ListOutput>({
      toolId: 'settings',
      input: { action: 'list' },
    })
    if (!result.success) fatalFromError(result.error)

    const entries = flattenSettings(result.data.settings)
    const rows = entries.map((e) => [e.key, e.value])
    ui.table([t('key').toUpperCase(), t('value').toUpperCase()], rows)
    console.log()
  })
}

export function createSettingsCommand(): Command {
  const cmd = new Command('settings').description(t('cmd.settings.description'))
  cmd.addCommand(createGetCommand())
  cmd.addCommand(createSetCommand())
  cmd.addCommand(createResetCommand())
  cmd.addCommand(createListCommand())
  return cmd
}
