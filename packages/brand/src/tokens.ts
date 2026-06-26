import { colors } from './colors.js'
import { spacing, layout, border } from './spacing.js'
import { fontFamily, fontWeight, fontSize } from './typography.js'
import { APP_NAME, CLI_NAME, APP_DESCRIPTION, symbols } from './constants.js'

export const tokens = {
  colors,
  spacing,
  layout,
  border,
  fontFamily,
  fontWeight,
  fontSize,
  meta: {
    name: APP_NAME,
    cli: CLI_NAME,
    description: APP_DESCRIPTION,
  },
  symbols,
} as const

export type Tokens = typeof tokens
