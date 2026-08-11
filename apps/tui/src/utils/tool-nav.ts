import { getVaultStatus, VAULT_TOOL_ID } from '@nbenhadi/mirror-vault'
import { SETTINGS_TOOL_ID } from '@nbenhadi/mirror-settings'
import { t } from '@nbenhadi/mirror-i18n'
import type { FieldSpec, FieldValues } from '../types.js'
import type { Navigate, Screen } from '../navigation.js'

export async function resolveToolEntry(toolId: string): Promise<Screen | null> {
  if (toolId === SETTINGS_TOOL_ID) return { id: 'settings' }
  if (toolId === VAULT_TOOL_ID) {
    const status = await getVaultStatus()
    if (status === 'unlocked') return { id: 'generic', toolId: VAULT_TOOL_ID }
    if (status === 'no-vault') return { id: 'generic', toolId: VAULT_TOOL_ID, action: 'init' }
    return { id: 'generic', toolId: VAULT_TOOL_ID, action: 'unlock' }
  }
  return null
}

export interface ToolProps {
  onBack: () => void
  onSuccess?: () => void
  handleResult?: (data: unknown) => boolean
  extraFields?: FieldSpec[]
  validateExtra?: (values: FieldValues) => string | null
  fieldSuggestions?: Record<string, (value: string) => Promise<string[]>>
  fieldVisible?: (key: string, values: FieldValues) => boolean
}

const confirmPasswordField = (key: string): FieldSpec => ({
  type: 'text',
  key,
  label: key,
  mask: true,
  default: '',
})

function passwordConfirm(
  confirmKey: string,
  sourceKey: string
): Pick<ToolProps, 'extraFields' | 'validateExtra'> {
  return {
    extraFields: [confirmPasswordField(confirmKey)],
    validateExtra: (values) =>
      values[confirmKey] !== values[sourceKey] ? t('cli.passwords_mismatch') : null,
  }
}

export function getToolProps(
  toolId: string,
  action: string | undefined,
  navigate: Navigate
): ToolProps {
  const onBack = () => {
    if (!action) return navigate({ id: 'home' })
    const parts = action.split('.')
    parts.pop()
    const parent = parts.join('.')
    return navigate(parent ? { id: 'generic', toolId, action: parent } : { id: 'generic', toolId })
  }

  if (toolId !== VAULT_TOOL_ID) {
    return { onBack }
  }

  const base: ToolProps = {
    onBack: () =>
      action ? navigate({ id: 'generic', toolId: VAULT_TOOL_ID }) : navigate({ id: 'home' }),
    ...(action === 'lock' && { onSuccess: () => navigate({ id: 'home' }) }),
    ...(action === 'unlock' && {
      onSuccess: () => navigate({ id: 'generic', toolId: VAULT_TOOL_ID }),
    }),
    ...(action === 'init' && {
      onSuccess: () => navigate({ id: 'generic', toolId: VAULT_TOOL_ID, action: 'unlock' }),
    }),
  }

  if (action === 'init') {
    return { ...base, ...passwordConfirm('confirmMasterPassword', 'masterPassword') }
  }
  if (action === 'rekey') {
    return { ...base, ...passwordConfirm('confirmNewPassword', 'newPassword') }
  }
  return base
}
