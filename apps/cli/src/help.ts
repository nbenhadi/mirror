import type { Command, Help } from 'commander'
import { t, type TranslationKey } from '@nbenhadi/mirror-i18n'

const ARG_KEYS: Record<string, TranslationKey> = {
  password: 'cmd.password.check.arg.password',
  locale: 'cmd.lang.arg.locale',
}

function localize(text: string): string {
  return text
    .replace('[options]', `[${t('cmd.help.options').toLowerCase()}]`)
    .replace('[command]', `[${t('cmd.help.commands').toLowerCase()}]`)
    .replace(/([[<])([\w-]+)(\.\.\.)?([\]>])/g, (match, open, name: string, variadic, close) => {
      const key = ARG_KEYS[name]
      return key ? `${open}${t(key)}${variadic ?? ''}${close}` : match
    })
}

function formatHelp(cmd: Command, helper: Help): string {
  const termWidth = helper.padWidth(cmd, helper)
  const lines: string[] = []

  const usage = localize(helper.commandUsage(cmd))

  const desc = helper.commandDescription(cmd)
  if (desc) {
    lines.push(desc)
    lines.push('')
  }

  lines.push(`${t('cmd.help.usage')}: ${usage}`)
  lines.push('')

  const argList = helper.visibleArguments(cmd)
  if (argList.length > 0) {
    lines.push(`${t('cmd.help.arguments')}:`)
    for (const arg of argList) {
      const key = ARG_KEYS[arg.name()]
      const term = key
        ? helper.argumentTerm(arg).replace(arg.name(), t(key))
        : helper.argumentTerm(arg)
      lines.push(`  ${term.padEnd(termWidth + 2)} ${helper.argumentDescription(arg)}`)
    }
    lines.push('')
  }

  const optionList = helper.visibleOptions(cmd)
  if (optionList.length > 0) {
    lines.push(`${t('cmd.help.options')}:`)
    for (const opt of optionList) {
      lines.push(
        `  ${helper.optionTerm(opt).padEnd(termWidth + 2)} ${helper.optionDescription(opt)}`
      )
    }
    lines.push('')
  }

  const cmdList = helper.visibleCommands(cmd)
  if (cmdList.length > 0) {
    lines.push(`${t('cmd.help.commands')}:`)
    for (const sub of cmdList) {
      const term = localize(helper.subcommandTerm(sub))
      const desc =
        sub.name() === 'help' ? t('cmd.help.display_help') : helper.subcommandDescription(sub)
      lines.push(`  ${term.padEnd(termWidth + 2)} ${desc}`)
    }
    lines.push('')
  }

  return lines.join('\n')
}

export function installHelp(cmd: Command): void {
  cmd.configureHelp({ formatHelp })
  cmd.helpOption('-h, --help', t('cmd.help.display_help'))
  for (const sub of cmd.commands) installHelp(sub)
}
