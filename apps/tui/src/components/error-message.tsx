import React from 'react'
import { Text } from 'ink'
import { colors } from '../theme.js'

interface ErrorMessageProps {
  message: string
}

export function ErrorMessage({ message }: ErrorMessageProps) {
  return <Text color={colors.danger}>{message}</Text>
}
