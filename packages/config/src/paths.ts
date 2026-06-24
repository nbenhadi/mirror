import { homedir, platform } from 'node:os'
import { join } from 'node:path'

export function getConfigDir(): string {
  const xdg = process.env['XDG_CONFIG_HOME']
  if (xdg && xdg.trim() !== '') {
    return join(xdg, 'mirror')
  }

  switch (platform()) {
    case 'darwin':
      return join(homedir(), 'Library', 'Application Support', 'mirror')
    case 'win32':
      return join(process.env['APPDATA'] ?? join(homedir(), 'AppData', 'Roaming'), 'mirror')
    default:
      return join(homedir(), '.config', 'mirror')
  }
}

export function getUserDataDir(): string {
  switch (platform()) {
    case 'win32':
      return join(homedir(), 'AppData', 'Local', 'mirror')
    case 'darwin':
      return join(homedir(), 'Library', 'Application Support', 'mirror')
    default:
      return join(homedir(), '.local', 'share', 'mirror')
  }
}

export function getConfigPath(): string {
  return join(getConfigDir(), 'config.json')
}
