import React from 'react'
import { Box, Text } from 'ink'
import { colors, dim, symbols } from '../theme.js'
import { capitalize } from '@nbenhadi/mirror-brand'

interface HeaderProps {
  title: string
  subtitle?: string | undefined
  description?: string
}

export function Header({ title, subtitle, description }: HeaderProps) {
  return (
    <Box flexDirection="column" marginBottom={1}>
      <Box gap={0}>
        <Text color={colors.primary} bold>
          {title}
        </Text>
        {subtitle && (
          <Text color={colors.primary} bold>
            {' '}
            {symbols.arrow} {subtitle}
          </Text>
        )}
      </Box>
      {description && <Text {...dim}>{capitalize(description)}</Text>}
    </Box>
  )
}
