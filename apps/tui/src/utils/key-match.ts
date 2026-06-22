import type { Key } from 'ink'

export function matchesCode(input: string, key: Key, code: string): boolean {
  switch (code) {
    case 'return':
      return key.return
    case 'escape':
      return key.escape
    case 'tab':
      return key.tab
    case 'backspace':
      return key.backspace
    case 'delete':
      return key.delete
    case 'space':
      return input === ' '
    case 'arrowUp':
      return key.upArrow
    case 'arrowDown':
      return key.downArrow
    case 'arrowLeft':
      return key.leftArrow
    case 'arrowRight':
      return key.rightArrow
    default: {
      const lower = code.toLowerCase()
      if (lower.startsWith('ctrl+')) return key.ctrl && input === lower.slice(5)
      return !key.ctrl && !key.meta && input === code
    }
  }
}
