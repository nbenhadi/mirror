import type { BundledSlideTheme } from './types.js'

export const BUNDLED_SLIDE_THEMES: BundledSlideTheme[] = [
  { id: 'default', description: 'marp default theme' },
  { id: 'gaia', description: 'marp gaia theme' },
  { id: 'uncover', description: 'marp uncover theme' },
]

export function getBundledSlideTheme(id: string): BundledSlideTheme | undefined {
  return BUNDLED_SLIDE_THEMES.find((theme) => theme.id === id)
}
