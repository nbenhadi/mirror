import { readConfigSync, KEYBINDINGS_DEFAULTS } from '@nbenhadi/mirror-config'

const DEFAULTS = KEYBINDINGS_DEFAULTS
const GLYPHS: Record<string, string> = {
  arrowUp: '↑',
  arrowDown: '↓',
  arrowLeft: '←',
  arrowRight: '→',
  return: '↵',
}

function label(code: string): string {
  return GLYPHS[code] ?? code
}

function build() {
  const o = readConfigSync().tui?.keybindings ?? {}
  const c = {
    quit: o.quit ?? DEFAULTS.quit,
    back: o.back ?? DEFAULTS.back,
    navigateUp: o.navigateUp ?? DEFAULTS.navigateUp,
    navigateDown: o.navigateDown ?? DEFAULTS.navigateDown,
    adjustLeft: o.adjustLeft ?? DEFAULTS.adjustLeft,
    adjustRight: o.adjustRight ?? DEFAULTS.adjustRight,
    select: o.select ?? DEFAULTS.select,
    toggle: o.toggle ?? DEFAULTS.toggle,
  }
  return {
    quit: { label: label(c.quit), code: c.quit },
    back: { label: label(c.back), code: c.back },
    navigate: {
      label: `${label(c.navigateUp)}${label(c.navigateDown)}`,
      up: c.navigateUp,
      down: c.navigateDown,
    },
    adjust: {
      label: `${label(c.adjustLeft)}${label(c.adjustRight)}`,
      left: c.adjustLeft,
      right: c.adjustRight,
    },
    select: { label: label(c.select), code: c.select },
    toggle: { label: label(c.toggle), code: c.toggle },
  }
}

export let keybindings = build()

export function reloadKeybindings(): void {
  keybindings = build()
}
