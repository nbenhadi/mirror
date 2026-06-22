import React from 'react'
import { Box, Text } from 'ink'
import { dim } from '../theme.js'

interface JsonViewProps {
  data: unknown
  labelWidth?: number
}

export function JsonView({ data, labelWidth }: JsonViewProps) {
  if (data === null || data === undefined) return null

  if (typeof data !== 'object' || Array.isArray(data)) {
    return <Text>{formatValue(data)}</Text>
  }

  const entries = Object.entries(data as Record<string, unknown>).filter(
    ([, v]) => v !== undefined && v !== null && v !== ''
  )

  const maxLen = labelWidth ?? Math.max(0, ...entries.map(([k]) => k.length))

  return (
    <Box flexDirection="column" gap={0}>
      {entries.map(([key, val]) => (
        <Box key={key} gap={2}>
          <Text {...dim}>{key.padEnd(maxLen)}</Text>
          <Text>{formatValue(val)}</Text>
        </Box>
      ))}
    </Box>
  )
}

function formatValue(val: unknown): string {
  if (Array.isArray(val)) return val.join(', ')
  if (val === null || val === undefined) return ''
  return String(val)
}
