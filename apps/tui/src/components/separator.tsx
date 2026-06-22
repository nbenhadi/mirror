import React from 'react'
import { Box, Text } from 'ink'
import { symbols } from '../theme.js'
import { useTerminalSize } from '../hooks/use-terminal-size.js'

interface SeparatorProps {
  label?: string
  labelColor?: string
}

export function Separator({ label, labelColor }: SeparatorProps) {
  const { width } = useTerminalSize()

  if (!label) {
    return <Text dimColor>{symbols.separator.repeat(width)}</Text>
  }

  const innerLen = label.length + 2
  const leftLen = Math.max(2, Math.floor((width - innerLen) / 2))
  const rightLen = Math.max(2, width - innerLen - leftLen)

  return (
    <Box>
      <Text dimColor>{symbols.separator.repeat(leftLen)}</Text>
      {labelColor ? <Text color={labelColor}> {label} </Text> : <Text dimColor> {label} </Text>}
      <Text dimColor>{symbols.separator.repeat(rightLen)}</Text>
    </Box>
  )
}
