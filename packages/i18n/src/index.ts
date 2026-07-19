import { detectLocale } from './detect.js'
import { DEFAULT_LOCALE, type Locale } from './types.js'
import type { TranslationKey } from './types.js'
import { en } from './locales/en.js'
import { es } from './locales/es.js'
import { fr } from './locales/fr.js'

export type { Locale, TranslationKey } from './types.js'
export { SUPPORTED_LOCALES, DEFAULT_LOCALE } from './types.js'

const locales: Record<Locale, Record<TranslationKey, string>> = { en, es, fr }

let currentLocale: Locale = detectLocale()

export function setLocale(locale: Locale): void {
  currentLocale = locale
}

export function getLocale(): Locale {
  return currentLocale
}

export function t(key: TranslationKey, params?: Record<string, string | number>): string {
  const str = locales[currentLocale][key] || locales[DEFAULT_LOCALE][key] || key
  if (!params) return str
  return str.replace(/\{(\w+)\}/g, (match, k) => {
    const val = params[k]
    return val !== undefined ? String(val) : match
  })
}

export function createTranslator(
  locale: Locale
): (key: TranslationKey, params?: Record<string, string | number>) => string {
  return (key, params) => {
    const str = locales[locale][key] || locales[DEFAULT_LOCALE][key] || key
    if (!params) return str
    return str.replace(/\{(\w+)\}/g, (match, k) => {
      const val = params[k]
      return val !== undefined ? String(val) : match
    })
  }
}
