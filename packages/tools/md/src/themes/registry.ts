import { defaultTheme } from './default.js'
import { cvTheme } from './cv.js'
import type { BundledTheme } from './types.js'

export const BUNDLED_THEMES: BundledTheme[] = [defaultTheme, cvTheme]

export function getBundledTheme(id: string): BundledTheme | undefined {
  return BUNDLED_THEMES.find((theme) => theme.id === id)
}
