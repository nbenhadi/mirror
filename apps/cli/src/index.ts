#!/usr/bin/env node
import { Command } from 'commander'
import { registry } from '@nbenhadi/mirror-core'
import { setLocale, SUPPORTED_LOCALES, t, type Locale } from '@nbenhadi/mirror-i18n'
import { passwordTool } from '@nbenhadi/mirror-password'
import { vaultTool } from '@nbenhadi/mirror-vault'
import { settingsTool } from '@nbenhadi/mirror-settings'
import { mdTool } from '@nbenhadi/mirror-md'
import { readConfigSync } from '@nbenhadi/mirror-config'
import { installHelp } from './utils/help.js'
import { createPasswordCommand } from './commands/password.js'
import { createVaultCommand } from './commands/vault.js'
import { createSettingsCommand } from './commands/settings.js'
import { createMdCommand } from './commands/md.js'
import pkg from '../package.json' with { type: 'json' }

const { version } = pkg

const lang = readConfigSync().general?.lang
if (lang && (SUPPORTED_LOCALES as readonly string[]).includes(lang)) {
  setLocale(lang as Locale)
}

registry.register(passwordTool)
registry.register(vaultTool)
registry.register(settingsTool)
registry.register(mdTool)

const program = new Command()
  .name('mir')
  .description(t('program.description'))
  .version(version, '-V, --version', t('cmd.help.version'))
  .helpOption('-h, --help', t('cmd.help.display_help'))
  .addHelpCommand('help [command]', t('cmd.help.commands'))

program.addCommand(createPasswordCommand())
program.addCommand(createVaultCommand())
program.addCommand(createSettingsCommand())
program.addCommand(createMdCommand())

installHelp(program)

program.parse()
