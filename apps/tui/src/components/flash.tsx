import React from 'react'
import { Text } from 'ink'
import { colors } from '../theme.js'
import type { FlashMessage } from '../hooks/use-flash.js'

const variantColor: Record<FlashMessage['variant'], string> = {
  success: colors.success,
  error: colors.danger,
  warning: colors.warning,
  info: colors.info,
}

interface FlashProps {
  flash: FlashMessage | null
}

export function Flash({ flash }: FlashProps) {
  if (!flash) return null

  return <Text color={variantColor[flash.variant]}>{flash.text}</Text>
}
