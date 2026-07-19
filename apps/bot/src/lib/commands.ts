import type { Command } from '../types/command.js'
import { password } from '../commands/password.js'
import { help } from '../commands/help.js'
import { clear } from '../commands/clear.js'
import { welcome } from '../commands/welcome.js'

export const commands = new Map<string, Command>([
  [password.data.name, password],
  [help.data.name, help],
  [clear.data.name, clear],
  [welcome.data.name, welcome],
])
