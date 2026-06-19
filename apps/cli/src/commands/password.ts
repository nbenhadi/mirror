import { Command } from 'commander'
import { execute } from '@mirror/core'
import { t } from '@mirror/i18n'

export function createPasswordCommand(): Command {
  const cmd = new Command('password').description(t('cmd.password.description'))

  cmd
    .command('generate')
    .description(t('cmd.password.generate.description'))
    .option('-l, --length <number>', t('cmd.password.generate.opt.length'), '16')
    .option('--no-uppercase', t('cmd.password.generate.opt.no_uppercase'))
    .option('--no-numbers', t('cmd.password.generate.opt.no_numbers'))
    .option('-s, --symbols', t('cmd.password.generate.opt.symbols'), false)
    .option('-a, --exclude-ambiguous', t('cmd.password.generate.opt.exclude_ambiguous'), false)
    .option('-e, --require-each', t('cmd.password.generate.opt.require_each'), false)
    .option('-u, --no-repeat', t('cmd.password.generate.opt.no_repeat'), false)
    .option('--exclude <chars>', t('cmd.password.generate.opt.exclude'))
    .option('--include <chars>', t('cmd.password.generate.opt.include'))
    .option('--separator <char>', t('cmd.password.generate.opt.separator'))
    .option('--every <number>', t('cmd.password.generate.opt.every'), '4')
    .option('--prefix <string>', t('cmd.password.generate.opt.prefix'))
    .option('--suffix <string>', t('cmd.password.generate.opt.suffix'))
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
        console.error(t('error.validation'))
        process.exit(1)
      }
    })

  return cmd
}
