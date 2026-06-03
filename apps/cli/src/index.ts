#!/usr/bin/env node
import { Command } from 'commander'
import { registry } from '@mirror/core'
import { passwordTool } from '@mirror/tools-password'
import { passwordCommand } from './commands/password.js'

registry.register(passwordTool)

const program = new Command()
  .name('mirror')
  .description('Mirror — modular tools platform')
  .version('0.1.0')

program.addCommand(passwordCommand)
program.parse()
