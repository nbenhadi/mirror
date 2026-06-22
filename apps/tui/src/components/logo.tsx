import React, { useState, useEffect } from 'react'
import { Box, Text } from 'ink'
import { colors } from '../theme.js'

const LOGO_RAW = [
  '   ▄▄▄▄███▄▄▄▄    ▄█     ▄████████    ▄████████  ▄██████▄     ▄████████ ',
  ' ▄██▀▀▀███▀▀▀██▄ ███    ███    ███   ███    ███ ███    ███   ███    ███ ',
  ' ███   ███   ███ ███▌   ███    ███   ███    ███ ███    ███   ███    ███ ',
  ' ███   ███   ███ ███▌  ▄███▄▄▄▄██▀  ▄███▄▄▄▄██▀ ███    ███  ▄███▄▄▄▄██▀ ',
  ' ███   ███   ███ ███▌ ▀▀███▀▀▀▀▀   ▀▀███▀▀▀▀▀   ███    ███ ▀▀███▀▀▀▀▀   ',
  ' ███   ███   ███ ███  ▀███████████ ▀███████████ ███    ███ ▀███████████ ',
  ' ███   ███   ███ ███    ███    ███   ███    ███ ███    ███   ███    ███ ',
  '  ▀█   ███   █▀  █▀     ███    ███   ███    ███  ▀██████▀    ███    ███ ',
  '                        ███    ███   ███    ███              ███    ███ ',
]

const NOISE = ['░', '▒', '▓', '▄', '▀']
const INTERVAL = 40
const GLITCH_EVERY = 15
const MAX_OFFSET = 10
const GLITCH_LIFE = 6
const MAX_SIMULTANEOUS = 4

const LINE_WIDTH = Math.max(...LOGO_RAW.map((l) => l.length))
const LOGO_LINES = LOGO_RAW.map((l) => l.padEnd(LINE_WIDTH))

interface Glitch {
  row: number
  offset: number
  life: number
}

function noise(len: number): string {
  return Array.from({ length: len }, () => NOISE[Math.floor(Math.random() * NOISE.length)]).join('')
}

function glitchSlice(line: string, offset: number): string {
  if (offset > 0) return noise(offset) + line.slice(0, LINE_WIDTH - offset)
  const abs = -offset
  return line.slice(abs) + noise(abs)
}

interface LogoProps {
  disableAnimation?: boolean
}

export function Logo({ disableAnimation = false }: LogoProps) {
  const [glitches, setGlitches] = useState<Glitch[]>([])

  useEffect(() => {
    if (disableAnimation) {
      setGlitches([])
      return
    }

    let tick = 0
    const id = setInterval(() => {
      tick++
      setGlitches((prev) => {
        const aged = prev.map((g) => ({ ...g, life: g.life - 1 })).filter((g) => g.life > 0)

        if (tick % GLITCH_EVERY === 0 && aged.length < MAX_SIMULTANEOUS) {
          const row = Math.floor(Math.random() * LOGO_LINES.length)
          const sign = Math.random() < 0.5 ? 1 : -1
          const offset = sign * (1 + Math.floor(Math.random() * MAX_OFFSET))
          return [...aged, { row, offset, life: GLITCH_LIFE }]
        }

        return aged
      })
    }, INTERVAL)

    return () => {
      clearInterval(id)
    }
  }, [disableAnimation])

  return (
    <Box flexDirection="column">
      {LOGO_LINES.map((line, i) => {
        const g = glitches.find((glitch) => glitch.row === i)
        return (
          <Text key={i} color={colors.primary}>
            {g ? glitchSlice(line, g.offset) : line}
          </Text>
        )
      })}
    </Box>
  )
}
