import { createTranslator } from '@nbenhadi/mirror-i18n'
import type { Locale, TranslationKey } from '@nbenhadi/mirror-i18n'
import { Locale as DiscordLocale, type LocalizationMap } from 'discord.js'

const LOCALE_MAP: Partial<Record<DiscordLocale, Locale>> = {
  [DiscordLocale.EnglishUS]: 'en',
  [DiscordLocale.EnglishGB]: 'en',
  [DiscordLocale.SpanishES]: 'es',
  [DiscordLocale.French]: 'fr',
}

export function getT(
  discordLocale: DiscordLocale
): (key: TranslationKey, params?: Record<string, string | number>) => string {
  return createTranslator(LOCALE_MAP[discordLocale] ?? 'en')
}

export function localize(
  key: TranslationKey,
  params?: Record<string, string | number>
): LocalizationMap {
  const result: LocalizationMap = {}
  for (const [discordLocale, mirrorLocale] of Object.entries(LOCALE_MAP) as [
    DiscordLocale,
    Locale,
  ][]) {
    result[discordLocale] = cap(createTranslator(mirrorLocale)(key, params))
  }
  return result
}

export function cap(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1)
}

export const en = createTranslator('en')
