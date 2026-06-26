export const spacing = {
  xs: 1,
  sm: 2,
  md: 4,
  lg: 8,
  xl: 16,
  xxl: 32,
} as const

export type Spacing = (typeof spacing)[keyof typeof spacing]

export const layout = {
  paddingX: 2,
  paddingY: 1,
} as const

export const border = {
  style: 'single',
} as const
