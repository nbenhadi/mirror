import { Command } from 'commander'
import { execute } from '@mirror/core'

export const passwordCommand = new Command('password').description('Password tools')

passwordCommand
  .command('generate')
  .description('Generate a cryptographically secure random password')
  .option('-l, --length <number>', 'Length (8-128)', '16')
  .option('--no-uppercase', 'Exclude uppercase letters')
  .option('--no-numbers', 'Exclude numbers')
  .option('-s, --symbols', 'Include symbols', false)
  .option('-a, --exclude-ambiguous', 'Exclude ambiguous chars (0 O 1 l I |)', false)
  .option('-e, --require-each', 'Guarantee at least one char of each active type', false)
  .option('-u, --no-repeat', 'No repeated characters', false)
  .option('--exclude <chars>', 'Characters to exclude from charset')
  .option('--include <chars>', 'Extra characters to add to charset')
  .option('--separator <char>', 'Separator character between groups')
  .option('--every <number>', 'Group size when using separator', '4')
  .option('--prefix <string>', 'Fixed prefix to prepend')
  .option('--suffix <string>', 'Fixed suffix to append')
  .action(async (options: Record<string, string | boolean | undefined>) => {
    const length = parseInt(String(options['length'] ?? '16'), 10)
    const every = parseInt(String(options['every'] ?? '4'), 10)
    const separatorChar = options['separator']

    const result = await execute<{ password: string }>({
      toolId: 'password',
      input: {
        action: 'generate',
        length,
        uppercase: options['uppercase'] !== false,
        numbers: options['numbers'] !== false,
        symbols: options['symbols'] === true,
        excludeAmbiguous: options['excludeAmbiguous'] === true,
        requireEach: options['requireEach'] === true,
        noRepeat: options['noRepeat'] === true,
        ...(options['exclude'] !== undefined && { exclude: String(options['exclude']) }),
        ...(options['include'] !== undefined && { include: String(options['include']) }),
        ...(separatorChar !== undefined && {
          separator: { char: String(separatorChar), every },
        }),
        ...(options['prefix'] !== undefined && { prefix: String(options['prefix']) }),
        ...(options['suffix'] !== undefined && { suffix: String(options['suffix']) }),
      },
    })

    if (result.success) {
      console.log(result.data.password)
    } else {
      console.error(`Error [${result.error.code}]: ${result.error.message}`)
      process.exit(1)
    }
  })
