export const APP_NAME = 'Mirror' as const
export const CLI_NAME = 'mir' as const
export const APP_DESCRIPTION = 'All your tools in one place' as const

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

export type Symbol = (typeof symbols)[keyof typeof symbols]
