import { describe, it, expect, beforeEach } from 'vitest'
import { t, setLocale, getLocale, SUPPORTED_LOCALES } from './index.js'

beforeEach(() => {
  setLocale('en')
})

describe('getLocale / setLocale', () => {
  it('defaults to en', () => {
    expect(getLocale()).toBe('en')
  })

  it('changes locale', () => {
    setLocale('es')
    expect(getLocale()).toBe('es')
  })

  it('supports all locales', () => {
    for (const locale of SUPPORTED_LOCALES) {
      setLocale(locale)
      expect(getLocale()).toBe(locale)
    }
  })
})

describe('t()', () => {
  it('returns translation for current locale', () => {
    expect(t('program.description')).toBe('One platform. Every interface.')
  })

  it('returns spanish translation', () => {
    setLocale('es')
    expect(t('program.description')).toBe('Una plataforma. Cada interfaz.')
  })

  it('returns french translation', () => {
    setLocale('fr')
    expect(t('program.description')).toBe('Une plateforme. Chaque interface.')
  })

  it('interpolates params', () => {
    expect(t('vault.list.count_many', { n: 5 })).toBe('5 entries')
  })

  it('interpolates multiple params', () => {
    expect(t('clipboard.copied', { seconds: 15 })).toBe('Copied to clipboard (clears in 15s).')
  })

  it('leaves unmatched placeholders intact', () => {
    expect(t('vault.list.count_many', { wrong: 5 })).toBe('{n} entries')
  })

  it('does not re-substitute param values containing placeholders', () => {
    expect(t('clipboard.copied', { seconds: '{seconds}' })).toBe(
      'Copied to clipboard (clears in {seconds}s).'
    )
  })

  it('returns key when translation missing', () => {
    // @ts-expect-error testing fallback with invalid key
    expect(t('nonexistent.key')).toBe('nonexistent.key')
  })
})

describe('locale completeness', () => {
  it('all locales return non-empty strings for core keys', () => {
    const testKeys = [
      'program.description',
      'vault.init.success',
      'cmd.password.description',
      'cmd.vault.description',
      'cmd.lang.description',
      'cmd.help.usage',
      'cmd.help.options',
      'cmd.help.commands',
    ] as const

    for (const locale of SUPPORTED_LOCALES) {
      setLocale(locale)
      for (const key of testKeys) {
        const val = t(key)
        expect(val, `${locale}: "${key}" missing`).not.toBe(key)
        expect(val.length, `${locale}: "${key}" empty`).toBeGreaterThan(0)
      }
    }
  })
})
