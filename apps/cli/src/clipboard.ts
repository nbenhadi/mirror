import { spawn, spawnSync } from 'node:child_process'
import { t } from '@mirror/i18n'

const CLEAR_SECONDS = 15

type ClipboardTool = { cmd: string; args: string[]; clearCmd: string; clearArgs: string[] }

function detectTool(): ClipboardTool | null {
  if (process.platform === 'darwin') {
    return {
      cmd: 'pbcopy',
      args: [],
      clearCmd: 'pbcopy',
      clearArgs: [],
    }
  }

  if (process.platform === 'win32' || process.env['WSL_DISTRO_NAME']) {
    const exe = process.env['WSL_DISTRO_NAME'] ? 'clip.exe' : 'clip'
    return {
      cmd: exe,
      args: [],
      clearCmd: exe,
      clearArgs: [],
    }
  }

  if (process.env['WAYLAND_DISPLAY'] && available('wl-copy')) {
    return {
      cmd: 'wl-copy',
      args: [],
      clearCmd: 'wl-copy',
      clearArgs: ['--clear'],
    }
  }

  if (available('xclip')) {
    return {
      cmd: 'xclip',
      args: ['-selection', 'clipboard'],
      clearCmd: 'xclip',
      clearArgs: ['-selection', 'clipboard', '-i', '/dev/null'],
    }
  }

  if (available('xsel')) {
    return {
      cmd: 'xsel',
      args: ['--clipboard', '--input'],
      clearCmd: 'xsel',
      clearArgs: ['--clipboard', '--clear'],
    }
  }

  return null
}

function available(cmd: string): boolean {
  return spawnSync('which', [cmd], { stdio: 'ignore' }).status === 0
}

function writeToClipboard(tool: ClipboardTool, text: string): void {
  const child = spawn(tool.cmd, tool.args, { detached: true, stdio: ['pipe', 'ignore', 'ignore'] })
  child.on('error', () => {})
  child.stdin!.on('error', () => {})
  child.stdin!.write(text)
  child.stdin!.end()
  child.unref()
}

function scheduleClear(tool: ClipboardTool, seconds: number): void {
  const code = `setTimeout(()=>{require('child_process').spawnSync(${JSON.stringify(tool.clearCmd)},${JSON.stringify(tool.clearArgs)},{input:''})},${seconds * 1000})`
  const child = spawn(process.execPath, ['-e', code], { detached: true, stdio: 'ignore' })
  child.on('error', () => {})
  child.unref()
}

export function copyToClipboard(text: string): void {
  const tool = detectTool()
  if (!tool) {
    console.log(t('clipboard.unavailable'))
    return
  }
  writeToClipboard(tool, text)
  scheduleClear(tool, CLEAR_SECONDS)
  console.log(t('clipboard.copied', { seconds: CLEAR_SECONDS }))
}
