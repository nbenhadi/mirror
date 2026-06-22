#!/usr/bin/env node
import { Command } from 'commander'
import { registry } from '@nbenhadi/mirror-core'
import { setLocale, SUPPORTED_LOCALES, t, type Locale } from '@nbenhadi/mirror-i18n'
import { passwordTool } from '@nbenhadi/mirror-password'
import { vaultTool } from '@nbenhadi/mirror-vault'
import { readCliConfig } from './cli-config.js'
import { installHelp } from './help.js'
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

program.addCommand(createPasswordCommand())
program.addCommand(createVaultCommand())
program.addCommand(createLangCommand())

installHelp(program)

program.parse()
