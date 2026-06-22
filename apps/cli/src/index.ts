#!/usr/bin/env node
import { Command } from 'commander'
import { registry } from '@nbenhadi/mirror-core'
import { setLocale, SUPPORTED_LOCALES, t, type Locale } from '@nbenhadi/mirror-i18n'
import { passwordTool } from '@nbenhadi/mirror-password'
import { vaultTool } from '@nbenhadi/mirror-vault'
import { readCliConfig } from './cli-config.js'
import { createPasswordCommand } from './commands/password.js'
import { createVaultCommand } from './commands/vault.js'
import { createLangCommand } from './commands/lang.js'
import pkg from '../package.json' with { type: 'json' }

const { version } = pkg

const { locale } = readCliConfig()
if (locale && (SUPPORTED_LOCALES as readonly string[]).includes(locale)) {
  setLocale(locale as Locale)
}

registry.register(passwordTool)
registry.register(vaultTool)

const program = new Command()
  .name('mir')
  .description(t('program.description'))
  .version(version, '-V, --version', t('cmd.help.version'))
  .helpOption('-h, --help', t('cmd.help.display_help'))
  .addHelpCommand('help [command]', t('cmd.help.commands'))

program.configureHelp({
  formatHelp: (cmd, helper) => {
    const termWidth = helper.padWidth(cmd, helper)
    const lines: string[] = []

    const usage = helper
      .commandUsage(cmd)
      .replace('[options]', `[${t('cmd.help.options').toLowerCase()}]`)
      .replace('[command]', `[${t('cmd.help.commands').toLowerCase()}]`)
    const desc = helper.commandDescription(cmd)
    if (desc) {
      lines.push(desc)
      lines.push('')
    }

    lines.push(`${t('cmd.help.usage')}: ${usage}`)
    lines.push('')

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
        lines.push(
          `  ${helper.subcommandTerm(sub).padEnd(termWidth + 2)} ${helper.subcommandDescription(sub)}`
        )
      }
      lines.push('')
    }

    return lines.join('\n')
  },
})

program.addCommand(createPasswordCommand())
program.addCommand(createVaultCommand())
program.addCommand(createLangCommand())

program.parse()
