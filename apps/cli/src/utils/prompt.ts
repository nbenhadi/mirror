export function promptConfirm(message: string, defaultYes = false): Promise<boolean> {
  return new Promise((resolve) => {
    const hint = defaultYes ? '[Y/n]' : '[y/N]'
    process.stdout.write(`${message} ${hint}: `)
    process.stdin.resume()
    process.stdin.setEncoding('utf8')

    const onData = (line: string) => {
      process.stdin.pause()
      process.stdin.removeListener('data', onData)
      const answer = line.trim().toLowerCase()
      if (answer === '') resolve(defaultYes)
      else resolve(answer === 'y' || answer === 'yes')
    }

    process.stdin.on('data', onData)
  })
}

export function promptPassword(message: string): Promise<string> {
  return new Promise((resolve) => {
    process.stdout.write(message)

    const isTTY = process.stdin.isTTY
    if (isTTY) process.stdin.setRawMode(true)
    process.stdin.resume()
    process.stdin.setEncoding('utf8')

    let password = ''

    const done = (value: string) => {
      if (isTTY) process.stdin.setRawMode(false)
      process.stdin.pause()
      process.stdin.removeListener('data', onData)
      process.stdout.write('\n')
      resolve(value)
    }

    const onData = (char: string) => {
      switch (char) {
        case '\n':
        case '\r':
        case '\u0004': // Ctrl+D (EOT)
          done(password)
          break
        case '\u0003': // Ctrl+C (ETX)
          done('')
          process.exit()
          break
        case '\u0008': // BS
        case '\x7f': // DEL
          if (password.length > 0) password = password.slice(0, -1)
          break
        default:
          password += char
      }
    }

    process.stdin.on('data', onData)
  })
}
