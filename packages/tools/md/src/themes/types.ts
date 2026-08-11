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
