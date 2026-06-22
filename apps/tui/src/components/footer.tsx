import React from 'react'
import { Box, Text, type TextProps } from 'ink'
import { dim, symbols } from '../theme.js'
import { Key } from './key.js'
import { Flash } from './flash.js'
import { Separator } from './separator.js'
import { useTerminalSize } from '../hooks/use-terminal-size.js'
import type { FlashMessage } from '../hooks/use-flash.js'

export interface KeyHint {
  key: string
  label: string
}

interface FooterProps {
  keys: KeyHint[]
  flash?: FlashMessage | null
  info?: string
  infoProps?: TextProps
}

export function Footer({ keys, flash = null, info, infoProps }: FooterProps) {
  const { width } = useTerminalSize()

  const visibleKeys = getVisibleKeys(keys, width)

  return (
    <Box flexDirection="column">
      <Separator />
      <Box>
        {flash ? (
          <Flash flash={flash} />
        ) : (
          <Box gap={0}>
            {visibleKeys.map((hint, i) => (
              <Box key={hint.key}>
                {i > 0 && <Text {...dim}> {symbols.dot} </Text>}
                <Key k={hint.key} label={hint.label} />
              </Box>
            ))}
          </Box>
        )}
      </Box>
      {info !== undefined && !flash && <Text {...(infoProps ?? dim)}>{info}</Text>}
    </Box>
  )
}

function getVisibleKeys(keys: KeyHint[], width: number): KeyHint[] {
  const separator = ` ${symbols.dot} `
  let used = 0
  const visible: KeyHint[] = []

  for (const hint of keys) {
    const len = hint.key.length + 1 + hint.label.length
    const cost = visible.length === 0 ? len : separator.length + len
    if (used + cost > width) break
    used += cost
    visible.push(hint)
  }

  return visible
}
