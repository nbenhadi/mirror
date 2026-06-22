import React from 'react'
import { Text } from 'ink'
import { colors } from '../theme.js'
import { useTerminalSize } from '../hooks/use-terminal-size.js'

interface BlockProps {
  text: string
}

export function Block({ text }: BlockProps) {
  const { width } = useTerminalSize()
  const content = ` ${text} `
  return (
    <Text bold backgroundColor={colors.secondary} color="black">
      {content.padEnd(width)}
    </Text>
  )
}
