import { useRef } from 'react'
import { useInput } from 'ink'
import { t } from '@nbenhadi/mirror-i18n'
import { keybindings } from '../utils/keybindings.js'
import { matchesCode } from '../utils/key-match.js'
import type { FlashVariant } from './use-flash.js'

type Notify = (text: string, variant?: FlashVariant) => void

export function useQuitConfirm(notify: Notify) {
  const pendingRef = useRef(false)
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useInput((input, key) => {
    if (!matchesCode(input, key, keybindings.quit.code)) return

    if (pendingRef.current) {
      if (timerRef.current) clearTimeout(timerRef.current)
      process.exit(0)
    } else {
      pendingRef.current = true
      notify(t('tui.confirm_quit', { key: keybindings.quit.label }), 'warning')
      timerRef.current = setTimeout(() => {
        pendingRef.current = false
      }, 2000)
    }
  })
}
