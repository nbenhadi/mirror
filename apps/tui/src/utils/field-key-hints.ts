import { t } from '@nbenhadi/mirror-i18n'
import { keybindings } from './keybindings.js'
import type { KeyHint } from '../components/footer.js'
import type { FieldSpec } from '../types.js'

export function fieldKeyHints(spec: FieldSpec): KeyHint[] {
  switch (spec.type) {
    case 'toggle':
      return [{ key: keybindings.toggle.label, label: t('tui.key.toggle') }]
    case 'number':
      return [{ key: keybindings.adjust.label, label: t('tui.key.adjust') }]
    case 'text':
    case 'group-header':
      return []
  }
}
