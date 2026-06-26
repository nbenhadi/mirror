import React from 'react'
import { Box, Text, useInput } from 'ink'
import TextInput from 'ink-text-input'
import { colors, dim, symbols } from '../theme.js'
import { FieldShell } from './field-shell.js'
import { matchesCode } from '../utils/key-match.js'
import { keybindings } from '../utils/keybindings.js'
import type { FieldSpec, FieldValue } from '../types.js'

interface FieldProps {
  spec: FieldSpec
  value: FieldValue | undefined
  onChange: (value: FieldValue) => void
  focus: boolean
  labelWidth?: number
}

const asBool = (v: FieldValue | undefined): boolean => (typeof v === 'boolean' ? v : false)
const asNumber = (v: FieldValue | undefined): number => (typeof v === 'number' ? v : 0)
const asString = (v: FieldValue | undefined): string => (typeof v === 'string' ? v : '')

export function Field({ spec, value, onChange, focus, labelWidth = 0 }: FieldProps) {
  const interactive = spec.type === 'toggle' || spec.type === 'number' || spec.type === 'select'

  useInput(
    (input, key) => {
      if (spec.type === 'toggle' && matchesCode(input, key, keybindings.toggle.code)) {
        onChange(!asBool(value))
      } else if (spec.type === 'number') {
        const step = key.shift ? (spec.step ?? 1) * 10 : (spec.step ?? 1)
        const min = spec.min ?? 0
        const max = spec.max ?? Infinity
        const current = asNumber(value)
        if (matchesCode(input, key, keybindings.adjust.left))
          onChange(Math.max(min, current - step))
        if (matchesCode(input, key, keybindings.adjust.right))
          onChange(Math.min(max, current + step))
      } else if (spec.type === 'select') {
        const opts = spec.options
        const curr = asString(value) || spec.default || opts[0] || ''
        const idx = opts.indexOf(curr)
        if (matchesCode(input, key, keybindings.adjust.left))
          onChange(opts[Math.max(0, idx - 1)] ?? curr)
        if (matchesCode(input, key, keybindings.adjust.right))
          onChange(opts[Math.min(opts.length - 1, idx + 1)] ?? curr)
      }
    },
    { isActive: focus && interactive }
  )

  if (spec.type === 'group-header') {
    return (
      <Box gap={2}>
        <Text> </Text>
        <Text {...dim}>{spec.label}</Text>
      </Box>
    )
  }

  const label = spec.indent ? `  ${spec.label}` : spec.label

  if (spec.type === 'toggle') {
    const on = asBool(value)
    return (
      <FieldShell label={label} focus={focus} labelWidth={labelWidth}>
        <Text {...(on ? { color: colors.primary } : dim)}>
          {on ? symbols.active : symbols.inactive}
        </Text>
      </FieldShell>
    )
  }

  if (spec.type === 'number') {
    const num = asNumber(value)
    return (
      <FieldShell
        label={label}
        focus={focus}
        labelWidth={labelWidth}
        left={focus ? symbols.arrowLeft : ' '}
        {...(focus && { right: symbols.arrowRight })}
      >
        <Text {...(focus ? { color: colors.primary, bold: true } : {})}>{num}</Text>
      </FieldShell>
    )
  }

  if (spec.type === 'select') {
    const opts = spec.options
    const curr = asString(value) || spec.default || opts[0] || ''
    return (
      <FieldShell
        label={label}
        focus={focus}
        labelWidth={labelWidth}
        left={focus ? symbols.arrowLeft : ' '}
        {...(focus && { right: symbols.arrowRight })}
      >
        <Text {...(focus ? { color: colors.primary, bold: true } : {})}>{curr}</Text>
      </FieldShell>
    )
  }

  const maxLength = 'maxLength' in spec ? spec.maxLength : undefined
  const mask = spec.type === 'text' && spec.mask
  const placeholder = 'placeholder' in spec ? spec.placeholder : undefined
  const handleChange =
    maxLength !== undefined ? (v: string) => onChange(v.slice(0, maxLength)) : onChange

  return (
    <FieldShell label={label} focus={focus} labelWidth={labelWidth}>
      <TextInput
        value={asString(value)}
        onChange={handleChange}
        focus={focus}
        {...(mask && { mask: symbols.bullet })}
        {...(placeholder !== undefined && { placeholder })}
      />
    </FieldShell>
  )
}
