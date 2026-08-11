import { spawn } from 'node:child_process'

export function spawnEditor(path: string): Promise<void> {
  const editorCmd = process.env['VISUAL'] || process.env['EDITOR'] || 'vi'
  const [cmd, ...cmdArgs] = editorCmd.split(' ').filter(Boolean)
  if (!cmd) return Promise.resolve()

  const wasRaw = process.stdin.isTTY && process.stdin.isRaw
  if (process.stdin.isTTY) process.stdin.setRawMode(false)
  process.stdin.pause()

  process.stdout.write('\x1b[2J\x1b[3J\x1b[H')

  const originalWrite = process.stdout.write.bind(process.stdout)
  process.stdout.write = () => true

  return new Promise((resolvePromise) => {
    const finish = () => {
      process.stdout.write = originalWrite
      if (process.stdin.isTTY && wasRaw) process.stdin.setRawMode(true)
      process.stdin.resume()
      resolvePromise()
    }

    const child = spawn(cmd, [...cmdArgs, path], { stdio: 'inherit' })
    child.on('exit', finish)
    child.on('error', finish)
  })
}
