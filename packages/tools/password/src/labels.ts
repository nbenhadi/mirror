import type { TranslationKey } from '@nbenhadi/mirror-i18n'
import type { StrengthLabel, WarningCode } from './actions/check.js'

export const STRENGTH_KEYS: Record<StrengthLabel, TranslationKey> = {
  'very-weak': 'cmd.password.check.strength.very_weak',
  weak: 'cmd.password.check.strength.weak',
  fair: 'cmd.password.check.strength.fair',
  strong: 'cmd.password.check.strength.strong',
  'very-strong': 'cmd.password.check.strength.very_strong',
}

export const WARNING_KEYS: Record<WarningCode, TranslationKey> = {
  'too-short': 'cmd.password.check.warning.too_short',
  'single-type': 'cmd.password.check.warning.single_type',
  'repeated-run': 'cmd.password.check.warning.repeated_run',
  sequence: 'cmd.password.check.warning.sequence',
  'low-variety': 'cmd.password.check.warning.low_variety',
}
