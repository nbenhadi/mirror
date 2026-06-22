import { Command } from 'commander'
import { execute } from '@nbenhadi/mirror-core'
import { t } from '@nbenhadi/mirror-i18n'
import { STRENGTH_KEYS, WARNING_KEYS, type CheckResult } from '@nbenhadi/mirror-password'
import { copyToClipboard } from '../clipboard.js'
import { promptPassword } from '../prompt.js'

function fmt(label: string, value: string) {
  console.log(`  ${label.padEnd(20)}${value}`)
}

function createGenerateCommand(): Command {
  return new Command('generate')
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
}

function createCheckCommand(): Command {
  return new Command('check')
    .description(t('cmd.password.check.description'))
    .argument('[password]', t('cmd.password.check.opt.password'))
    .action(async (password?: string) => {
      const value = password ?? (await promptPassword(t('cmd.password.check.opt.password')))

      const result = await execute<CheckResult>({
        toolId: 'password',
        input: { action: 'check', password: value },
      })

      if (!result.success) {
        console.error(t('error.validation'))
        process.exit(1)
      }

      const d = result.data

      console.log()
      fmt(
        t('cmd.password.check.label.strength') + ':',
        `${t(STRENGTH_KEYS[d.label])} (${d.score}/4)`
      )
      fmt(t('cmd.password.check.label.entropy') + ':', `${d.effectiveBits} bits`)
      fmt(t('cmd.password.check.label.crack_time') + ':', d.crackTime)
      if (d.warnings.length > 0) {
        console.log()
        console.log(`  ${t('cmd.password.check.label.warnings')}:`)
        for (const w of d.warnings) console.log(`    - ${t(WARNING_KEYS[w])}`)
      }
      console.log()
    })
}

function createPassphraseCommand(): Command {
  return new Command('passphrase')
    .description(t('cmd.password.passphrase.description'))
    .option('-w, --words <number>', t('cmd.password.passphrase.opt.words'), '6')
    .option('-s, --separator <char>', t('cmd.password.passphrase.opt.separator'), '-')
    .option('-c, --capitalize', t('cmd.password.passphrase.opt.capitalize'), false)
    .option('-n, --number', t('cmd.password.passphrase.opt.number'), false)
    .action(
      async (options: {
        words: string
        separator: string
        capitalize: boolean
        number: boolean
      }) => {
        const result = await execute<{ passphrase: string; entropyBits: number }>({
          toolId: 'password',
          input: {
            action: 'passphrase',
            words: parseInt(options.words, 10),
            separator: options.separator,
            capitalize: options.capitalize === true,
            number: options.number === true,
          },
        })

        if (!result.success) {
          console.error(t('error.validation'))
          process.exit(1)
        }

        console.log(result.data.passphrase)
        copyToClipboard(result.data.passphrase)
      }
    )
}

export function createPasswordCommand(): Command {
  const cmd = new Command('password').description(t('cmd.password.description'))
  cmd.addCommand(createGenerateCommand())
  cmd.addCommand(createCheckCommand())
  cmd.addCommand(createPassphraseCommand())
  return cmd
}
