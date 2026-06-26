import React, { type ReactNode } from 'react'
import { Box, Text, useInput } from 'ink'
import { dim, symbols } from '../theme.js'
import { matchesCode } from '../utils/key-match.js'
import { keybindings } from '../utils/keybindings.js'

interface SelectorProps<T> {
  items: readonly T[]
  cursor: number
  onCursorChange: (index: number) => void
  renderItem: (item: T, selected: boolean) => ReactNode
  keyExtractor: (item: T, index: number) => string
  maxVisible?: number
  isActive?: boolean
  isSelectable?: (item: T) => boolean
}

export function Selector<T>({
  items,
  cursor,
  onCursorChange,
  renderItem,
  keyExtractor,
  maxVisible = 8,
  isActive = true,
  isSelectable,
}: SelectorProps<T>) {
  const { start, end, hasAbove, hasBelow } = getVisibleWindow(items.length, cursor, maxVisible)
  const visible = items.slice(start, end)

  const moveTo = (from: number, dir: -1 | 1) => {
    let next = from + dir
    while (next >= 0 && next < items.length) {
      const item = items[next]
      if (item === undefined || !isSelectable || isSelectable(item)) break
      next += dir
    }
    if (next >= 0 && next < items.length) onCursorChange(next)
  }

  useInput(
    (input, key) => {
      if (matchesCode(input, key, keybindings.navigate.up)) moveTo(cursor, -1)
      if (matchesCode(input, key, keybindings.navigate.down)) moveTo(cursor, 1)
    },
    { isActive }
  )

  if (items.length === 0) return null

  return (
    <Box flexDirection="column">
      <Text {...dim}>{hasAbove ? symbols.scrollUp : ' '}</Text>
      {visible.map((item, i) => {
        const index = start + i
        return <Box key={keyExtractor(item, index)}>{renderItem(item, index === cursor)}</Box>
      })}
      <Text {...dim}>{hasBelow ? symbols.scrollDown : ' '}</Text>
    </Box>
  )
}

export interface ListWindow {
  start: number
  end: number
  hasAbove: boolean
  hasBelow: boolean
}

export function getVisibleWindow(count: number, cursor: number, maxVisible: number): ListWindow {
  if (count <= maxVisible) {
    return { start: 0, end: count, hasAbove: false, hasBelow: false }
  }
  let start = cursor - Math.floor(maxVisible / 2)
  start = Math.max(0, Math.min(start, count - maxVisible))
  const end = start + maxVisible
  return { start, end, hasAbove: start > 0, hasBelow: end < count }
}
