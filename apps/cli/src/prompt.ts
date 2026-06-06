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

    if (process.stdin.isTTY) {
      process.stdin.setRawMode(true)
    }

    process.stdin.resume()
    process.stdin.setEncoding('utf8')

    let password = ''

    const onData = (char: string) => {
      switch (char) {
        case '\n':
        case '\r':
        case '':
          if (process.stdin.isTTY) process.stdin.setRawMode(false)
          process.stdin.pause()
          process.stdin.removeListener('data', onData)
          process.stdout.write('\n')
          resolve(password)
          break
        case '':
          process.exit()
          break
        case '':
          password = password.slice(0, -1)
          break
        default:
          password += char
      }
    }

    process.stdin.on('data', onData)
  })
}
