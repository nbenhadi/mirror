#!/usr/bin/env node
import { Command } from 'commander'
import { registry } from '@mirror/core'
import { passwordTool } from '@mirror/tools-password'
import { vaultTool } from '@mirror/tools-vault'
import { passwordCommand } from './commands/password.js'
import { vaultCommand } from './commands/vault.js'

registry.register(passwordTool)
registry.register(vaultTool)

const program = new Command()
  .name('mirror')
  .description('Mirror — modular tools platform')
  .version('0.1.0')

program.addCommand(passwordCommand)
program.addCommand(vaultCommand)
program.parse()
