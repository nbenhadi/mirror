import React, { type ReactNode } from 'react'
import { Box, Text } from 'ink'
import { colors, dim, symbols } from '../theme.js'

interface FieldShellProps {
  label: string
  focus: boolean
  labelWidth: number
  children: ReactNode
  left?: ReactNode
  right?: ReactNode
}

export function FieldShell({ label, focus, labelWidth, children, left, right }: FieldShellProps) {
  return (
    <Box gap={2}>
      <Text color={colors.primary}>{focus ? symbols.arrow : ' '}</Text>
      <Text {...(focus ? { color: colors.primary } : dim)}>{label.padEnd(labelWidth)}</Text>
      <Box gap={1}>
        <Text {...dim}>{left ?? ' '}</Text>
        {children}
        {right !== undefined && <Text {...dim}>{right}</Text>}
      </Box>
    </Box>
  )
}
