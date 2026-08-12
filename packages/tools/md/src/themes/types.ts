export const THEME_KINDS = ['document', 'slide'] as const

export type ThemeKind = (typeof THEME_KINDS)[number]

export interface Margins {
  x: number
  y: number
}

export interface BundledTheme {
  id: string
  description: string
  css: string
  margins?: Margins
}

export interface BundledSlideTheme {
  id: string
  description: string
}
