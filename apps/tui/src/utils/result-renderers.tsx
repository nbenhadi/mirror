import React, { type ReactNode } from 'react'
import { t } from '@nbenhadi/mirror-i18n'
import { STRENGTH_KEYS, WARNING_KEYS, type CheckResult } from '@nbenhadi/mirror-password'
import { Block } from '../components/block.js'
import { JsonView } from '../components/json-view.js'
import { pickString } from './result.js'
import { colors } from '../theme.js'

export type ResultRenderer = (action: string | undefined, data: unknown) => ReactNode

function isCheckResult(data: unknown): data is CheckResult {
  if (data === null || typeof data !== 'object') return false
  const d = data as Record<string, unknown>
  return (
    typeof d['label'] === 'string' &&
    typeof d['severity'] === 'string' &&
    Array.isArray(d['warnings'])
  )
}

function checkView(data: CheckResult): Record<string, unknown> {
  const view: Record<string, unknown> = {
    [t('cmd.password.check.label.strength')]: `${t(STRENGTH_KEYS[data.label])} (${data.score}/4)`,
    [t('cmd.password.check.label.entropy')]: `${data.effectiveBits} bits`,
    [t('cmd.password.check.label.crack_time')]: data.crackTime,
  }
  if (data.warnings.length > 0) {
    view[t('cmd.password.check.label.warnings')] = data.warnings.map((w) =>
      t(WARNING_KEYS[w], w === 'too-short' ? { min: 8 } : undefined)
    )
  }
  return view
}

const renderPassword: ResultRenderer = (action, data) => {
  if (action === 'check' && isCheckResult(data)) {
    return (
      <Block color={colors[data.severity]}>
        <JsonView data={checkView(data)} />
      </Block>
    )
  }
  return <Block text={pickString(data) ?? String(data)} />
}

function isUrlResult(data: unknown): data is { url: string } {
  return (
    data !== null && typeof data === 'object' && typeof (data as { url?: unknown }).url === 'string'
  )
}

const renderMdPreview: ResultRenderer = (_action, data) => {
  const text = isUrlResult(data) ? data.url : (pickString(data) ?? String(data))
  return <Block text={text} color={colors.success} />
}

const renderers: Record<string, ResultRenderer> = {
  password: renderPassword,
}

const actionRenderers: Record<string, ResultRenderer> = {
  'md:preview': renderMdPreview,
}

export function getResultRenderer(
  toolId: string,
  action: string | undefined
): ResultRenderer | undefined {
  if (action) {
    const scoped = actionRenderers[`${toolId}:${action}`]
    if (scoped) return scoped
  }
  return renderers[toolId]
}
