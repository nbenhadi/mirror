import React from 'react'
import { Box, Text } from 'ink'
import { colors, dim, symbols } from '../theme.js'
import { useTerminalSize } from '../hooks/use-terminal-size.js'

export interface Column {
  key: string
  label: string
}

interface TableProps {
  columns: Column[]
  rows: Record<string, string>[]
  selectedIndex?: number
}

const GAP = 2

export function Table({ columns, rows, selectedIndex }: TableProps) {
  const { width } = useTerminalSize()
  const colWidths = resolveWidths(columns, rows, width)

  return (
    <Box flexDirection="column">
      <Box gap={GAP}>
        {columns.map((col, i) => (
          <Text key={col.key} {...dim}>
            {col.label.toUpperCase().padEnd(colWidths[i] ?? col.label.length)}
          </Text>
        ))}
      </Box>
      {rows.map((row, rowIdx) => {
        const selected = rowIdx === selectedIndex
        return (
          <Box key={rowIdx} gap={GAP}>
            {columns.map((col, colIdx) => {
              const raw = row[col.key] ?? ''
              const colW = colWidths[colIdx] ?? 10

              if (raw === '') {
                return (
                  <Text key={col.key} {...dim}>
                    {symbols.separator.padEnd(colW)}
                  </Text>
                )
              }

              const val = truncate(raw, colW).padEnd(colW)
              return (
                <Text key={col.key} {...(selected && { color: colors.primary })}>
                  {val}
                </Text>
              )
            })}
          </Box>
        )
      })}
    </Box>
  )
}

function truncate(str: string, maxLen: number): string {
  return str.length > maxLen ? str.slice(0, maxLen - 1) + symbols.ellipsis : str
}

function resolveWidths(
  columns: Column[],
  rows: Record<string, string>[],
  terminalWidth: number
): number[] {
  const gap = (columns.length - 1) * GAP

  const natural = columns.map((col) => {
    const maxContent = Math.max(0, ...rows.map((r) => (r[col.key] ?? '').length))
    return Math.max(col.label.length, maxContent) + 2
  })

  const total = natural.reduce((s, w) => s + w, 0) + gap
  if (total <= terminalWidth) return natural

  const widths = [...natural]
  let excess = total - terminalWidth
  while (excess > 0) {
    const max = Math.max(...widths)
    if (max <= 3) break
    const idx = widths.lastIndexOf(max)
    widths[idx] = max - 1
    excess--
  }
  return widths
}
