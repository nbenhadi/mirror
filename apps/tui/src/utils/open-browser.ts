import { spawn, spawnSync } from 'node:child_process'

function available(cmd: string): boolean {
  return spawnSync('which', [cmd], { stdio: 'ignore' }).status === 0
}

function launch(cmd: string, args: string[]): void {
  const child = spawn(cmd, args, { detached: true, stdio: 'ignore', windowsHide: true })
  child.on('error', () => {})
  child.unref()
}

export function openInBrowser(url: string): void {
  if (process.platform === 'win32') {
    launch('cmd', ['/c', 'start', '""', url])
    return
  }
  if (process.platform === 'darwin') {
    launch('open', [url])
    return
  }
  if (process.env['WSL_DISTRO_NAME']) {
    launch('wslview', [url])
    return
  }
  if (available('xdg-open')) launch('xdg-open', [url])
}
