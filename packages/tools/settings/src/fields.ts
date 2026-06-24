import { SUPPORTED_LOCALES } from '@nbenhadi/mirror-i18n'
import { KEYBINDINGS_DEFAULTS, getUserDataDir } from '@nbenhadi/mirror-config'

export interface FieldDef {
  key: string
  default?: string
  options?: string[]
  description?: string
  validate(value: unknown): string | null
}

function nonEmptyString(value: unknown): string | null {
  return typeof value === 'string' && value.trim() !== ''
    ? null
    : 'value must be a non-empty string'
}

function oneOfLocales(value: unknown): string | null {
  return typeof value === 'string' && (SUPPORTED_LOCALES as readonly string[]).includes(value)
    ? null
    : `value must be one of: ${SUPPORTED_LOCALES.join(', ')}`
}

export const EDITABLE_FIELDS: FieldDef[] = [
  {
    key: 'general.lang',
    default: 'en',
    options: [...SUPPORTED_LOCALES],
    description: 'cmd.settings.opt.general.lang',
    validate: oneOfLocales,
  },
  {
    key: 'tui.keybindings.quit',
    default: KEYBINDINGS_DEFAULTS.quit,
    description: 'cmd.settings.opt.tui.keybindings.quit',
    validate: nonEmptyString,
  },
  {
    key: 'tui.keybindings.back',
    default: KEYBINDINGS_DEFAULTS.back,
    description: 'cmd.settings.opt.tui.keybindings.back',
    validate: nonEmptyString,
  },
  {
    key: 'tui.keybindings.navigateUp',
    default: KEYBINDINGS_DEFAULTS.navigateUp,
    description: 'cmd.settings.opt.tui.keybindings.navigateUp',
    validate: nonEmptyString,
  },
  {
    key: 'tui.keybindings.navigateDown',
    default: KEYBINDINGS_DEFAULTS.navigateDown,
    description: 'cmd.settings.opt.tui.keybindings.navigateDown',
    validate: nonEmptyString,
  },
  {
    key: 'tui.keybindings.adjustLeft',
    default: KEYBINDINGS_DEFAULTS.adjustLeft,
    description: 'cmd.settings.opt.tui.keybindings.adjustLeft',
    validate: nonEmptyString,
  },
  {
    key: 'tui.keybindings.adjustRight',
    default: KEYBINDINGS_DEFAULTS.adjustRight,
    description: 'cmd.settings.opt.tui.keybindings.adjustRight',
    validate: nonEmptyString,
  },
  {
    key: 'tui.keybindings.select',
    default: KEYBINDINGS_DEFAULTS.select,
    description: 'cmd.settings.opt.tui.keybindings.select',
    validate: nonEmptyString,
  },
  {
    key: 'tui.keybindings.toggle',
    default: KEYBINDINGS_DEFAULTS.toggle,
    description: 'cmd.settings.opt.tui.keybindings.toggle',
    validate: nonEmptyString,
  },
  {
    key: 'tools.vault.path',
    default: getUserDataDir(),
    description: 'cmd.settings.opt.tools.vault.path',
    validate: nonEmptyString,
  },
]

export const PROTECTED_PREFIXES = ['version', 'tools.vault.salt', 'tools.vault.kdf']

export { SUPPORTED_LOCALES }

export function findField(key: string): FieldDef | undefined {
  return EDITABLE_FIELDS.find((f) => f.key === key)
}

export function isProtected(key: string): boolean {
  return PROTECTED_PREFIXES.some((p) => key === p || key.startsWith(`${p}.`))
}
