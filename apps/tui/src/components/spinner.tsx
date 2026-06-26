import React, { useState, useEffect } from 'react'
import { Text } from 'ink'
import { colors, dim } from '../theme.js'

const VARIANTS = {
  dots: { frames: ['⠋', '⠙', '⠹', '⠸', '⠼', '⠴', '⠦', '⠧', '⠇', '⠏'], interval: 80 },
  line: { frames: ['|', '/', '-', '\\'], interval: 120 },
  pulse: { frames: ['●', '○', '●', '○'], interval: 500 },
} as const

export type SpinnerVariant = keyof typeof VARIANTS

interface SpinnerProps {
  label?: string
  variant?: SpinnerVariant
}

export function Spinner({ label, variant = 'dots' }: SpinnerProps) {
  const { frames, interval } = VARIANTS[variant]
  const [frame, setFrame] = useState(0)

  useEffect(() => {
    const id = setInterval(() => setFrame((f) => (f + 1) % frames.length), interval)
    return () => clearInterval(id)
  }, [frames.length, interval])

  const current = frames[frame] ?? frames[0]

  return (
    <Text>
      <Text color={colors.primary}>{current}</Text>
      {label && <Text {...dim}> {label}</Text>}
    </Text>
  )
}
