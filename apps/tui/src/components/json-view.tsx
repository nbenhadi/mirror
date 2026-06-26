import React from 'react'
import { Box, Text } from 'ink'
import { colors, dim } from '../theme.js'

interface JsonViewProps {
  data: unknown
  indent?: number
}

export function JsonView({ data, indent = 0 }: JsonViewProps) {
  if (data === null || data === undefined) return null

  if (typeof data !== 'object' || Array.isArray(data)) {
    return <Text>{formatValue(data)}</Text>
  }

  const entries = Object.entries(data as Record<string, unknown>).filter(
    ([, v]) => v !== undefined && v !== null && v !== ''
  )

  const flatEntries = entries.filter(
    ([, v]) => !(typeof v === 'object' && v !== null && !Array.isArray(v))
  )
  const maxLen = Math.max(0, ...flatEntries.map(([k]) => k.length))
  const firstObjIdx = entries.findIndex(
    ([, v]) => typeof v === 'object' && v !== null && !Array.isArray(v)
  )

  return (
    <Box flexDirection="column">
      {entries.map(([key, val], i) => {
        const isObj = typeof val === 'object' && val !== null && !Array.isArray(val)
        if (isObj) {
          return (
            <Box
              key={key}
              flexDirection="column"
              marginTop={indent === 0 && i !== firstObjIdx ? 1 : 0}
            >
              <Text bold color={colors.secondary}>
                {key.toUpperCase()}
              </Text>
              <Box paddingLeft={2}>
                <JsonView data={val} indent={indent + 1} />
              </Box>
            </Box>
          )
        }
        return (
          <Box key={key} flexDirection="row" gap={2}>
            <Text {...dim}>{key.padEnd(maxLen)}</Text>
            <Text>{formatValue(val)}</Text>
          </Box>
        )
      })}
    </Box>
  )
}

function formatValue(val: unknown): string {
  if (Array.isArray(val)) return val.join(', ')
  if (val === null || val === undefined) return ''
  return String(val)
}
