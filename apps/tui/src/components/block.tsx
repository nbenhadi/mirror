import React, { type ReactNode } from 'react'
import { Box, Text } from 'ink'
import { colors } from '../theme.js'
import { useTerminalSize } from '../hooks/use-terminal-size.js'

interface BlockProps {
  text?: string
  children?: ReactNode
  color?: string
}

export function Block({ text, children, color = colors.secondary }: BlockProps) {
  const { width } = useTerminalSize()
  return (
    <Box width={width} borderStyle="round" borderColor={color} paddingX={1}>
      {children ?? <Text>{text}</Text>}
    </Box>
  )
}
