export const colors = {
  primary: '#BDFF19',
  secondary: '#A587FF',
  success: '#5EFF94',
  warning: '#FFCE4E',
  danger: '#FF756E',
  info: '#71B1FF',
} as const

export type Color = (typeof colors)[keyof typeof colors]
