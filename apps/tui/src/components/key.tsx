import React from 'react'
import { Text } from 'ink'
import { colors, dim } from '../theme.js'

interface KeyProps {
  k: string
  label: string
}

export function Key({ k, label }: KeyProps) {
  return (
    <Text>
      <Text color={colors.primary}>{k}</Text>
      <Text {...dim}> {label}</Text>
    </Text>
  )
}
