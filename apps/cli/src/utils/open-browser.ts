import { spawn, spawnSync } from 'node:child_process'

function available(cmd: string): boolean {
  return spawnSync('which', [cmd], { stdio: 'ignore' }).status === 0
}

function detectCommand(): string | null {
  if (process.platform === 'darwin') return 'open'
  if (process.platform === 'win32') return 'start'
  if (process.env['WSL_DISTRO_NAME']) return 'wslview'
  if (available('xdg-open')) return 'xdg-open'
  return null
}

export function openInBrowser(url: string): void {
  const cmd = detectCommand()
  if (!cmd) return
  const child = spawn(cmd, [url], { detached: true, stdio: 'ignore' })
  child.on('error', () => {})
  child.unref()
}
