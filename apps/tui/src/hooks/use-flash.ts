import { useState, useRef, useEffect, useCallback } from 'react'
import { capitalize } from '@nbenhadi/mirror-brand'

export type FlashVariant = 'success' | 'error' | 'warning' | 'info'

export interface FlashMessage {
  text: string
  variant: FlashVariant
}

export function useFlash(duration = 1700) {
  const [flash, setFlash] = useState<FlashMessage | null>(null)
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const notify = useCallback(
    (text: string, variant: FlashVariant = 'success') => {
      if (timerRef.current) clearTimeout(timerRef.current)
      setFlash({ text: capitalize(text), variant })
      timerRef.current = setTimeout(() => setFlash(null), duration)
    },
    [duration]
  )

  useEffect(
    () => () => {
      if (timerRef.current) clearTimeout(timerRef.current)
    },
    []
  )

  return { flash, notify }
}
