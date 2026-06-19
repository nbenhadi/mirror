import { Command } from 'commander'
import { getLocale, setLocale, SUPPORTED_LOCALES, t, type Locale } from '@mirror/i18n'
import { writeCliConfig } from '../cli-config.js'

export function createLangCommand(): Command {
  return new Command('lang')
    .description(t('cmd.lang.description'))
    .argument('[locale]', `(${SUPPORTED_LOCALES.join(', ')})`)
    .action((locale?: string) => {
      if (!locale) {
        console.log(getLocale())
        return
      }

      if (!(SUPPORTED_LOCALES as readonly string[]).includes(locale)) {
        console.error(t('cmd.lang.error.unsupported', { locales: SUPPORTED_LOCALES.join(', ') }))
        process.exit(1)
      }

      writeCliConfig({ locale })
      setLocale(locale as Locale)
      console.log(t('cmd.lang.success', { locale }))
    })
}
