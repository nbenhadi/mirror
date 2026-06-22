export const colors = {
  primary: '#BDFF19',
  secondary: '#A587FF',
  success: '#5EFF94',
  warning: '#FFCE4E',
  danger: '#FF756E',
  info: '#71B1FF',
} as const

export type Color = (typeof colors)[keyof typeof colors]

export const dim = { dimColor: true } as const

export const symbols = {
  arrow: '›',
  dot: '·',
  bullet: '•',
  tick: '✓',
  cross: '✗',
  active: '●',
  inactive: '○',
  separator: '─',
  scrollUp: '↑',
  scrollDown: '↓',
  arrowLeft: '←',
  arrowRight: '→',
  ellipsis: '…',
} as const

export const border = {
  style: 'single' as const,
} as const

export const layout = {
  paddingX: 2,
  paddingY: 1,
} as const
