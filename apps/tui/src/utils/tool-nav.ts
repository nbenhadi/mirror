import { getVaultStatus, VAULT_TOOL_ID } from '@nbenhadi/mirror-vault'
import { SETTINGS_TOOL_ID } from '@nbenhadi/mirror-settings'
import {
  MD_TOOL_ID,
  type EditResult,
  type PreviewResult,
  type ThemeListResult,
  type ThemeCreateResult,
  type ThemeEditResult,
  type ThemeKind,
} from '@nbenhadi/mirror-md'
import { execute } from '@nbenhadi/mirror-core'
import { t } from '@nbenhadi/mirror-i18n'
import { openInBrowser } from './open-browser.js'
import { spawnEditor } from './spawn-editor.js'
import type { FieldSpec, FieldValues } from '../types.js'
import type { Navigate, Screen } from '../navigation.js'

async function themeSuggestions(
  prefix: string,
  kind: ThemeKind = 'document',
  userOnly = false
): Promise<string[]> {
  const result = await execute({ toolId: MD_TOOL_ID, input: { action: 'theme.list', kind } })
  if (!result.success) return []
  const { themes } = result.data as ThemeListResult
  const filtered = userOnly ? themes.filter((theme) => theme.source === 'user') : themes
  return filtered.map((theme) => theme.id).filter((id) => id.startsWith(prefix))
}

async function userThemeSuggestions(prefix: string): Promise<string[]> {
  return themeSuggestions(prefix, 'document', true)
}

async function slideThemeSuggestions(prefix: string): Promise<string[]> {
  return themeSuggestions(prefix, 'slide')
}

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

function exportFieldVisible(key: string, values: FieldValues): boolean {
  return key !== 'pages' || values['format'] === 'pdf'
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

  if (toolId === MD_TOOL_ID && action === 'edit') {
    return {
      onBack,
      handleResult: (data) => {
        const { path, url } = data as EditResult
        openInBrowser(url)
        void spawnEditor(path).then(() => navigate({ id: 'generic', toolId: MD_TOOL_ID }))
        return true
      },
    }
  }

  if (toolId === MD_TOOL_ID && action === 'export') {
    return {
      onBack,
      fieldSuggestions: { theme: themeSuggestions },
      fieldVisible: exportFieldVisible,
    }
  }

  if (toolId === MD_TOOL_ID && action === 'slides') {
    return {
      onBack,
      fieldSuggestions: { theme: slideThemeSuggestions },
    }
  }

  if (toolId === MD_TOOL_ID && action === 'theme.create') {
    return {
      onBack,
      handleResult: (data) => {
        const { cssPath } = data as ThemeCreateResult
        void spawnEditor(cssPath).then(() =>
          navigate({ id: 'generic', toolId: MD_TOOL_ID, action: 'theme' })
        )
        return true
      },
    }
  }

  if (toolId === MD_TOOL_ID && action === 'theme.edit') {
    return {
      onBack,
      fieldSuggestions: { name: userThemeSuggestions },
      handleResult: (data) => {
        const { cssPath } = data as ThemeEditResult
        void spawnEditor(cssPath).then(() =>
          navigate({ id: 'generic', toolId: MD_TOOL_ID, action: 'theme' })
        )
        return true
      },
    }
  }

  if (toolId === MD_TOOL_ID && action === 'theme.delete') {
    return {
      onBack,
      fieldSuggestions: { name: userThemeSuggestions },
      onSuccess: () => navigate({ id: 'generic', toolId: MD_TOOL_ID, action: 'theme' }),
    }
  }

  if (toolId === MD_TOOL_ID && action === 'preview') {
    return {
      onBack,
      handleResult: (data) => {
        const { url } = data as PreviewResult
        openInBrowser(url)
        return false
      },
    }
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
