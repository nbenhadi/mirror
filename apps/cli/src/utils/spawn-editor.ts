import { spawn } from 'node:child_process'
import { t } from '@nbenhadi/mirror-i18n'
import { capitalize } from '@nbenhadi/mirror-brand'

function defaultEditor(): string {
  return process.platform === 'win32' ? 'notepad' : 'vi'
}

export function spawnEditor(path: string): Promise<void> {
  const editorCmd = process.env['VISUAL'] || process.env['EDITOR'] || defaultEditor()
  const [cmd, ...cmdArgs] = editorCmd.split(' ').filter(Boolean)
  if (!cmd) return Promise.resolve()

  const wasRaw = process.stdin.isTTY && process.stdin.isRaw
  if (process.stdin.isTTY) process.stdin.setRawMode(false)
  process.stdin.pause()

  process.stdout.write('\x1b[2J\x1b[3J\x1b[H')
  process.stdout.write(`${capitalize(t('editor.waiting'))}\n`)

  const originalWrite = process.stdout.write.bind(process.stdout)
  process.stdout.write = () => true

  return new Promise((resolvePromise) => {
    let settled = false

    const child = spawn(cmd, [...cmdArgs, path], { stdio: 'inherit' })

    const onCancel = () => {
      child.kill()
    }

    const finish = () => {
      if (settled) return
      settled = true
      process.off('SIGINT', onCancel)
      process.stdout.write = originalWrite
      if (process.stdin.isTTY && wasRaw) process.stdin.setRawMode(true)
      process.stdin.resume()
      resolvePromise()
    }

    process.once('SIGINT', onCancel)

    child.on('exit', finish)
    child.on('error', finish)
  })
}
