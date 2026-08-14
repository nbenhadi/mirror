import { t } from '@nbenhadi/mirror-i18n'
import { keybindings } from './keybindings.js'
import type { KeyHint } from '../components/footer.js'
import type { FieldSpec } from '../types.js'

function suggestHints(): KeyHint[] {
  return [
    { key: 'tab', label: t('tui.key.complete') },
    { key: 'shift+tab', label: t('tui.key.list') },
    { key: 'ctrl+u', label: t('tui.key.clear') },
  ]
}

export function fieldKeyHints(spec: FieldSpec, hasSuggestions = false): KeyHint[] {
  switch (spec.type) {
    case 'toggle':
      return [{ key: keybindings.toggle.label, label: t('tui.key.toggle') }]
    case 'number':
    case 'select':
      return [{ key: keybindings.adjust.label, label: t('tui.key.adjust') }]
    case 'path':
      return suggestHints()
    case 'text':
      return hasSuggestions ? suggestHints() : []
    case 'text-array':
    case 'group-header':
      return []
  }
}
