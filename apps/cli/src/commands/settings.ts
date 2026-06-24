import { Command } from 'commander'
import { execute } from '@nbenhadi/mirror-core'
import {
  EDITABLE_FIELDS,
  type GetOutput,
  type SetOutput,
  type ResetOutput,
  type ListOutput,
} from '@nbenhadi/mirror-settings'
import { t } from '@nbenhadi/mirror-i18n'
import chalk from 'chalk'
import { promptConfirm } from '../utils/prompt.js'
import * as ui from '../utils/ui.js'

function getAtPath(obj: unknown, path: string): unknown {
  let cur: unknown = obj
  for (const p of path.split('.')) {
    if (cur === null || typeof cur !== 'object') return undefined
    cur = (cur as Record<string, unknown>)[p]
  }
  return cur
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
      if (!result.success) ui.fatal(t('error.validation'))

      const key = String(result.data.key)
      const value = String(result.data.value ?? '')
      const keyW = Math.max('KEY'.length, key.length)
      ui.tableHeader(['KEY', 'VALUE'], [keyW, 0])
      ui.tableRow([key, value], [keyW, 0])
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
      if (!result.success) ui.fatal(t('error.validation'))
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
      const listResult = await execute<ListOutput>({
        toolId: 'settings',
        input: { action: 'list' },
      })
      if (!listResult.success) ui.fatal(t('error.validation'))

      const settings = listResult.data.settings
      const key = options.key as string | undefined

      const fields =
        key && key !== 'all'
          ? EDITABLE_FIELDS.filter((f) => f.key === key && f.default !== undefined)
          : EDITABLE_FIELDS.filter((f) => f.default !== undefined)

      const changes = fields
        .map((f) => ({
          key: f.key,
          before: getAtPath(settings, f.key) ?? f.default,
          after: f.default as unknown,
        }))
        .filter((c) => String(c.before) !== String(c.after))

      if (changes.length === 0) {
        ui.hint(t('cmd.settings.reset.success'))
        return
      }

      const colKey = t('cmd.settings.reset.col.key')
      const colBefore = t('cmd.settings.reset.col.before')
      const colAfter = t('cmd.settings.reset.col.after')
      const keyW = Math.max(colKey.length, ...changes.map((c) => c.key.length))
      const beforeW = Math.max(colBefore.length, ...changes.map((c) => String(c.before).length))

      ui.tableHeader([colKey, colBefore, colAfter], [keyW, beforeW, 0])
      for (const c of changes) {
        console.log(
          `  ${c.key.padEnd(keyW)}  ${chalk.red(String(c.before).padEnd(beforeW))}  ${chalk.green(String(c.after))}`
        )
      }
      console.log()

      const confirmed = await promptConfirm(t('cmd.settings.reset.confirm'))
      if (!confirmed) return

      const result = await execute<ResetOutput>({
        toolId: 'settings',
        input: { action: 'reset', ...(key && key !== 'all' ? { key } : {}) },
      })
      if (!result.success) ui.fatal(t('error.validation'))
      ui.printSuccess(t('cmd.settings.reset.success'))
    })
}

function createListCommand(): Command {
  return new Command('list').description(t('cmd.settings.list.description')).action(async () => {
    const result = await execute<ListOutput>({
      toolId: 'settings',
      input: { action: 'list' },
    })
    if (!result.success) ui.fatal(t('error.validation'))

    const entries = flattenSettings(result.data.settings)
    const keyW = Math.max('KEY'.length, ...entries.map((e) => e.key.length))
    ui.tableHeader(['KEY', 'VALUE'], [keyW, 0])
    for (const e of entries) {
      ui.tableRow([e.key, e.value], [keyW, 0])
    }
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
