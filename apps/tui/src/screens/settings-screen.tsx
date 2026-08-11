import React, { useState, useEffect } from 'react'
import { Box, Text, useInput } from 'ink'
import { EDITABLE_FIELDS } from '@nbenhadi/mirror-settings'
import {
  t,
  setLocale,
  SUPPORTED_LOCALES,
  type Locale,
  type TranslationKey,
} from '@nbenhadi/mirror-i18n'
import { Header } from '../components/header.js'
import { Selector } from '../components/selector.js'
import { Field } from '../components/field.js'
import { Footer, type KeyHint } from '../components/footer.js'
import { Block } from '../components/block.js'
import { JsonView } from '../components/json-view.js'
import { Spinner } from '../components/spinner.js'
import { keybindings, reloadKeybindings } from '../utils/keybindings.js'
import { matchesCode } from '../utils/key-match.js'
import { fieldKeyHints } from '../utils/field-key-hints.js'
import { useExecute } from '../hooks/use-execute.js'
import { useFlash } from '../hooks/use-flash.js'
import { useQuitConfirm } from '../hooks/use-quit-confirm.js'
import { capitalize } from '@nbenhadi/mirror-brand'
import { colors, dim } from '../theme.js'
import type { Navigate } from '../navigation.js'
import type { FieldSpec, FieldValue } from '../types.js'

const FIELD_KEYS = EDITABLE_FIELDS.map((f) => f.key)
const RESET_KEYS = [
  'all',
  ...EDITABLE_FIELDS.filter((f) => f.default !== undefined).map((f) => f.key),
]
const MENU_ACTIONS = ['get', 'set', 'reset', 'list'] as const

interface ResetChange {
  key: string
  before: unknown
  after: unknown
}

type Phase =
  | { id: 'menu'; cursor: number }
  | { id: 'get'; key: string; result: string | null }
  | { id: 'set'; key: string; value: FieldValue; cursor: number }
  | { id: 'reset.key'; selectedKey: string; allSettings: unknown }
  | {
      id: 'reset.preview'
      resetKey: string
      changes: ResetChange[]
      prevKey: string
      allSettings: unknown
    }
  | { id: 'list.result'; data: unknown }

function buildValueSpec(key: string): FieldSpec {
  const field = EDITABLE_FIELDS.find((f) => f.key === key)
  if (field?.options) {
    return {
      type: 'select',
      key: 'value',
      label: 'value',
      options: field.options,
      default: field.default ?? '',
    }
  }
  return {
    type: 'text',
    key: 'value',
    label: 'value',
    default: '',
    placeholder: field?.default !== undefined ? String(field.default) : '',
  }
}

function phaseSubtitle(phase: Phase): string | undefined {
  switch (phase.id) {
    case 'get':
      return 'get'
    case 'set':
      return 'set'
    case 'reset.key':
    case 'reset.preview':
      return 'reset'
    case 'list.result':
      return 'list'
    default:
      return undefined
  }
}

function buildFooterKeys(phase: Phase, isEditingText: boolean): KeyHint[] {
  const nav: KeyHint = { key: keybindings.navigate.label, label: t('tui.key.navigate') }
  const submit: KeyHint = { key: keybindings.select.label, label: t('tui.key.submit') }
  const back: KeyHint = {
    key: isEditingText ? 'esc' : `esc/${keybindings.back.label}`,
    label: t('tui.key.back'),
  }
  const adj: KeyHint = { key: keybindings.adjust.label, label: t('tui.key.adjust') }

  switch (phase.id) {
    case 'menu':
      return [nav, submit, back]
    case 'get':
      return [adj, submit, back]
    case 'reset.key':
      return [adj, submit, back]
    case 'set': {
      const fieldHints = phase.cursor === 0 ? [adj] : fieldKeyHints(buildValueSpec(phase.key))
      return [nav, ...fieldHints, submit, back]
    }
    case 'reset.preview':
      return [submit, back]
    default:
      return [back]
  }
}

export function SettingsScreen({ navigate }: { navigate: Navigate }) {
  const [phase, setPhase] = useState<Phase>({ id: 'menu', cursor: 0 })
  const [pending, setPending] = useState<Phase | null>(null)
  const { run, loading, error, clearError } = useExecute<Record<string, unknown>>('settings')
  const { flash, notify } = useFlash()
  useQuitConfirm(notify)

  useEffect(() => {
    if (!pending) return
    const next = pending
    const id = setTimeout(() => {
      process.stdout.write('\x1b[2J\x1b[3J\x1b[H')
      setPhase(next)
      setPending(null)
    }, 0)
    return () => clearTimeout(id)
  }, [pending])

  function goTo(next: Phase) {
    if (next.id !== phase.id) setPending(next)
    else setPhase(next)
  }

  const isEditingText =
    phase.id === 'set' && phase.cursor === 1 && buildValueSpec(phase.key).type === 'text'

  const keyLabel = 'key'

  useInput((input, key) => {
    if (loading) return
    if (key.escape || (!isEditingText && matchesCode(input, key, keybindings.back.code))) {
      clearError()
      if (phase.id === 'menu') navigate({ id: 'home' })
      else if (phase.id === 'reset.preview')
        goTo({ id: 'reset.key', selectedKey: phase.prevKey, allSettings: phase.allSettings })
      else goTo({ id: 'menu', cursor: 0 })
      return
    }
    if (key.return) void handleEnter()
  })

  const handleEnter = async () => {
    if (loading) return
    clearError()

    if (phase.id === 'menu') {
      const action = MENU_ACTIONS[phase.cursor]
      if (!action) return
      if (action === 'list') {
        const data = await run({ action: 'list' })
        if (data !== null)
          goTo({ id: 'list.result', data: (data as { settings: unknown }).settings })
      } else if (action === 'get') {
        const firstKey = FIELD_KEYS[0]
        if (!firstKey) return
        goTo({ id: 'get', key: firstKey, result: null })
      } else if (action === 'set') {
        const firstKey = FIELD_KEYS[0]
        if (!firstKey) return
        goTo({ id: 'set', key: firstKey, value: '', cursor: 0 })
      } else if (action === 'reset') {
        const data = await run({ action: 'list' })
        if (data !== null)
          goTo({
            id: 'reset.key',
            selectedKey: 'all',
            allSettings: (data as { settings: unknown }).settings,
          })
      }
      return
    }

    if (phase.id === 'get') {
      const data = await run({ action: 'get', key: phase.key })
      if (data !== null)
        setPhase({ ...phase, result: String((data as { value: unknown }).value ?? '') })
      return
    }

    if (phase.id === 'set') {
      const { key, value } = phase
      const field = EDITABLE_FIELDS.find((f) => f.key === key)
      const strVal = String(value) || (field?.default !== undefined ? String(field.default) : '')
      const data = await run({ action: 'set', key, value: strVal })
      if (data !== null) {
        if (key === 'general.lang' && (SUPPORTED_LOCALES as readonly string[]).includes(strVal)) {
          setLocale(strVal as Locale)
        }
        if (key.startsWith('tui.keybindings.')) {
          reloadKeybindings()
        }
        notify(t('cmd.settings.set.success', { key, value: strVal }))
        goTo({ id: 'menu', cursor: 0 })
      }
      return
    }

    if (phase.id === 'reset.key') {
      const key = phase.selectedKey === 'all' ? undefined : phase.selectedKey
      const input =
        key !== undefined
          ? { action: 'reset', key, apply: false }
          : { action: 'reset', apply: false }
      const data = await run(input)
      if (data !== null) {
        const diff = (data as { diff: { changes: ResetChange[]; hasChanges: boolean } }).diff
        if (!diff.hasChanges) {
          notify(t('cmd.settings.reset.no_changes'), 'info')
          return
        }
        goTo({
          id: 'reset.preview',
          resetKey: phase.selectedKey,
          changes: diff.changes,
          prevKey: phase.selectedKey,
          allSettings: phase.allSettings,
        })
      }
      return
    }

    if (phase.id === 'reset.preview') {
      const key = phase.resetKey === 'all' ? undefined : phase.resetKey
      const data = await run(key !== undefined ? { action: 'reset', key } : { action: 'reset' })
      if (data !== null) {
        reloadKeybindings()
        notify(t('cmd.settings.reset.success'))
        goTo({ id: 'menu', cursor: 0 })
      }
      return
    }

    if (phase.id === 'list.result') {
      goTo({ id: 'menu', cursor: 0 })
    }
  }

  if (pending !== null) return null

  return (
    <Box flexDirection="column">
      <Header
        title="settings"
        subtitle={phaseSubtitle(phase)}
        description={capitalize(t('cmd.settings.description'))}
      />

      {!loading && phase.id === 'menu' && (
        <MenuView
          cursor={phase.cursor}
          onCursorChange={(c) => setPhase({ id: 'menu', cursor: c })}
        />
      )}

      {!loading &&
        phase.id === 'get' &&
        (() => {
          const keySpec: FieldSpec = {
            type: 'select',
            key: 'key',
            label: keyLabel,
            options: FIELD_KEYS,
            default: phase.key,
          }
          return (
            <Box flexDirection="column">
              <Box paddingLeft={2}>
                <Field
                  spec={keySpec}
                  value={phase.key}
                  onChange={(v) => setPhase({ id: 'get', key: String(v), result: null })}
                  focus={true}
                  labelWidth={keyLabel.length}
                />
              </Box>
              {phase.result !== null &&
                (() => {
                  const keyW = Math.max('key'.length, phase.key.length)
                  return (
                    <Block>
                      <Box flexDirection="column">
                        <Box gap={2}>
                          <Text {...dim}>{'KEY'.padEnd(keyW)}</Text>
                          <Text {...dim}>VALUE</Text>
                        </Box>
                        <Box gap={2}>
                          <Text>{phase.key.padEnd(keyW)}</Text>
                          <Text>{phase.result}</Text>
                        </Box>
                      </Box>
                    </Block>
                  )
                })()}
            </Box>
          )
        })()}

      {!loading &&
        phase.id === 'set' &&
        (() => {
          const keySpec: FieldSpec = {
            type: 'select',
            key: 'key',
            label: keyLabel,
            options: FIELD_KEYS,
            default: phase.key,
          }
          const valueSpec = buildValueSpec(phase.key)
          const maxW = Math.max(keySpec.label.length, valueSpec.label.length)
          return (
            <Selector
              items={[keySpec, valueSpec]}
              cursor={phase.cursor}
              onCursorChange={(c) => setPhase({ ...phase, cursor: c })}
              keyExtractor={(s) => s.key}
              renderItem={(spec, selected) => {
                const val: FieldValue = spec.key === 'key' ? phase.key : phase.value
                const handleChange = (v: FieldValue) => {
                  if (spec.key === 'key') setPhase({ ...phase, key: String(v), value: '' })
                  else setPhase({ ...phase, value: v })
                }
                return (
                  <Field
                    spec={spec}
                    value={val}
                    onChange={handleChange}
                    focus={selected}
                    labelWidth={maxW}
                  />
                )
              }}
            />
          )
        })()}

      {!loading &&
        phase.id === 'reset.key' &&
        (() => {
          const resetKeySpec: FieldSpec = {
            type: 'select',
            key: 'key',
            label: keyLabel,
            options: RESET_KEYS,
            default: phase.selectedKey,
          }
          return (
            <Box paddingLeft={2}>
              <Field
                spec={resetKeySpec}
                value={phase.selectedKey}
                onChange={(v) => setPhase({ ...phase, selectedKey: String(v) })}
                focus={true}
                labelWidth={keyLabel.length}
              />
            </Box>
          )
        })()}

      {!loading &&
        phase.id === 'reset.preview' &&
        (() => {
          const changed = phase.changes.filter((c) => String(c.before) !== String(c.after))
          const colKey = t('cmd.settings.reset.col.key')
          const colBefore = t('cmd.settings.reset.col.before')
          const colAfter = t('cmd.settings.reset.col.after')
          const keyW = Math.max(colKey.length, ...changed.map((c) => c.key.length))
          const beforeW = Math.max(colBefore.length, ...changed.map((c) => String(c.before).length))
          return (
            <Block>
              <Box flexDirection="column">
                <Box gap={2}>
                  <Text {...dim}>{colKey.toUpperCase().padEnd(keyW)}</Text>
                  <Text {...dim}>{colBefore.toUpperCase().padEnd(beforeW)}</Text>
                  <Text {...dim}>{colAfter.toUpperCase()}</Text>
                </Box>
                {changed.map((c) => (
                  <Box key={c.key} gap={2}>
                    <Text>{c.key.padEnd(keyW)}</Text>
                    <Text color={colors.danger}>{String(c.before).padEnd(beforeW)}</Text>
                    <Text color={colors.success}>{String(c.after)}</Text>
                  </Box>
                ))}
              </Box>
            </Block>
          )
        })()}

      {!loading && phase.id === 'list.result' && (
        <Block>
          <JsonView data={phase.data} />
        </Block>
      )}

      {loading && (
        <Box marginTop={1} paddingLeft={2}>
          <Spinner label={t('tui.working')} />
        </Box>
      )}
      {!loading && error && (
        <Box marginTop={1}>
          <Block text={error} color={colors.danger} />
        </Box>
      )}
      <Box marginTop={1}>
        <Footer
          keys={buildFooterKeys(phase, isEditingText)}
          flash={flash}
          {...(() => {
            let descKey: TranslationKey | null = null
            if (phase.id === 'get') descKey = 'cmd.settings.get.opt.key'
            else if (phase.id === 'set')
              descKey =
                phase.cursor === 0 ? 'cmd.settings.set.opt.key' : 'cmd.settings.set.opt.value'
            else if (phase.id === 'reset.key') descKey = 'cmd.settings.reset.opt.key'
            return descKey
              ? { info: t(descKey), infoProps: { color: colors.info, italic: true } }
              : {}
          })()}
        />
      </Box>
    </Box>
  )
}

function MenuView({
  cursor,
  onCursorChange,
}: {
  cursor: number
  onCursorChange: (c: number) => void
}) {
  const maxW = Math.max(...MENU_ACTIONS.map((a) => a.length))
  return (
    <Selector
      items={[...MENU_ACTIONS]}
      cursor={cursor}
      onCursorChange={onCursorChange}
      keyExtractor={(a) => a}
      renderItem={(action, selected) => (
        <Box gap={3} paddingLeft={2}>
          <Box minWidth={maxW}>
            <Text {...(selected ? { color: colors.primary } : dim)}>{action}</Text>
          </Box>
          <Text {...(selected ? { color: colors.primary } : dim)}>
            {capitalize(t(`cmd.settings.${action}.description` as TranslationKey))}
          </Text>
        </Box>
      )}
    />
  )
}
