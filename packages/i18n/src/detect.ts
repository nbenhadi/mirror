import { SUPPORTED_LOCALES, DEFAULT_LOCALE, type Locale } from './types.js'

export function detectLocale(): Locale {
  const candidates = [
    process.env['LC_ALL'],
    process.env['LC_MESSAGES'],
    process.env['LANG'],
    Intl.DateTimeFormat().resolvedOptions().locale,
  ]

  for (const candidate of candidates) {
    if (!candidate) continue
    const lang = candidate.split(/[_.-]/)[0]?.toLowerCase()
    if (lang && (SUPPORTED_LOCALES as readonly string[]).includes(lang)) {
      return lang as Locale
    }
  }

  return DEFAULT_LOCALE
}
