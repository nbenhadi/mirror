import React, { useState, useEffect, useMemo, useRef, type ReactNode } from 'react'
import { Box, Text, useInput } from 'ink'
import { t, type TranslationKey } from '@nbenhadi/mirror-i18n'
import type { Tool } from '@nbenhadi/mirror-core'
import { Header } from '../components/header.js'
import { Selector } from '../components/selector.js'
import { Field } from '../components/field.js'
import { Footer, type KeyHint } from '../components/footer.js'
import { Table } from '../components/table.js'
import { Block } from '../components/block.js'
import { JsonView } from '../components/json-view.js'
import { Spinner } from '../components/spinner.js'
import { keybindings } from '../utils/keybindings.js'
import { matchesCode } from '../utils/key-match.js'
import { fieldKeyHints } from '../utils/field-key-hints.js'
import {
  getSubcommandsAt,
  getVariantSchema,
  isLeafAction,
  schemaToFields,
  initialValues,
  unflattenValues,
  type SubcommandNode,
} from '../utils/schema-to-fields.js'
import { capitalize } from '@nbenhadi/mirror-brand'
import { pickString } from '../utils/result.js'
import { useExecute } from '../hooks/use-execute.js'
import { useFlash } from '../hooks/use-flash.js'
import { useQuitConfirm } from '../hooks/use-quit-confirm.js'
import type { FieldSpec, FieldValue, FieldValues } from '../types.js'
import { colors, dim } from '../theme.js'

export interface GenericScreenProps {
  tool: Tool
  action?: string | undefined
  onSelect: (action: string) => void
  onBack: () => void
  onSuccess?: () => void
  handleResult?: ((data: unknown) => boolean) | undefined
  renderResult?: ((result: unknown) => ReactNode) | undefined
  extraFields?: FieldSpec[] | undefined
  validateExtra?: ((values: FieldValues) => string | null) | undefined
  fieldSuggestions?: Record<string, (value: string) => Promise<string[]>> | undefined
  fieldVisible?: ((key: string, values: FieldValues) => boolean) | undefined
}

type Item = { kind: 'sub'; node: SubcommandNode } | { kind: 'field'; field: FieldSpec }

export function GenericScreen({
  tool,
  action,
  onSelect,
  onBack,
  onSuccess,
  handleResult,
  renderResult,
  extraFields,
  validateExtra,
  fieldSuggestions,
  fieldVisible,
}: GenericScreenProps) {
  const isLeaf = useMemo(
    () => action !== undefined && isLeafAction(tool.schema, action),
    [tool, action]
  )
  const children = useMemo(
    () => (isLeaf ? [] : getSubcommandsAt(tool.schema, action ?? '')),
    [tool, action, isLeaf]
  )
  const variantSchema = useMemo(
    () => (isLeaf && action ? getVariantSchema(tool.schema, action) : null),
    [tool, action, isLeaf]
  )
  const { fields, constants } = useMemo(
    () => (variantSchema ? schemaToFields(variantSchema) : { fields: [], constants: {} }),
    [variantSchema]
  )

  const makeInitialValues = () => ({
    ...initialValues(fields),
    ...initialValues(extraFields ?? []),
  })

  const [values, setValues] = useState<FieldValues>(makeInitialValues)

  const items = useMemo<Item[]>(() => {
    const isVisible = (f: FieldSpec) => !fieldVisible || fieldVisible(f.key, values)
    const base = isLeaf
      ? fields.filter(isVisible).map((field) => ({ kind: 'field' as const, field }))
      : children.map((node) => ({ kind: 'sub' as const, node }))
    const extra = (extraFields ?? [])
      .filter(isVisible)
      .map((f) => ({ kind: 'field' as const, field: f }))
    return [...base, ...extra]
  }, [isLeaf, fields, children, extraFields, fieldVisible, values])

  const firstSelectable = items.findIndex((item) =>
    item.kind === 'sub' ? true : item.field.type !== 'group-header'
  )
  const [cursor, setCursor] = useState(Math.max(0, firstSelectable))

  useEffect(() => {
    if (cursor >= items.length) setCursor(Math.max(0, items.length - 1))
  }, [items.length, cursor])

  const [result, setResult] = useState<unknown>(null)
  const [localError, setLocalError] = useState<string | null>(null)
  const [fieldInfo, setFieldInfo] = useState<string | undefined>()

  const { run, loading, error: execError, clearError } = useExecute(tool.id)
  const { flash, notify } = useFlash()
  useQuitConfirm(notify)

  const currentItem = items[cursor]
  const focused = currentItem?.kind === 'field' ? currentItem.field : undefined
  const editingText = focused?.type === 'text' || focused?.type === 'path'

  const subWidth = useMemo(
    () => Math.max(0, ...children.map((node) => node.segment.length)),
    [children]
  )

  const labelWidth = useMemo(
    () =>
      Math.max(
        0,
        ...fields
          .filter((f) => f.type !== 'group-header')
          .map((f) => (f.indent ? f.label.length + 2 : f.label.length)),
        ...(extraFields ?? []).map((f) => f.label.length)
      ),
    [fields, extraFields]
  )

  const extraKeys = useMemo(() => new Set(extraFields?.map((f) => f.key) ?? []), [extraFields])

  const onSubmit = async () => {
    setLocalError(null)
    clearError()

    if (validateExtra) {
      const validationError = validateExtra(values)
      if (validationError) {
        setLocalError(validationError)
        return
      }
    }

    const cleanValues =
      extraKeys.size > 0
        ? Object.fromEntries(Object.entries(values).filter(([k]) => !extraKeys.has(k)))
        : values

    const allFields = [...fields, ...(extraFields ?? [])]
    const arrayKeys = new Set<string>(
      allFields.filter((f) => f.type === 'text-array').map((f) => f.key)
    )

    const plainValues: FieldValues = {}
    const arrayData: Record<string, string[]> = {}
    for (const [k, v] of Object.entries(cleanValues)) {
      if (arrayKeys.has(k)) {
        const str = typeof v === 'string' ? v.trim() : ''
        arrayData[k] = str
          ? str
              .split(',')
              .map((s) => s.trim())
              .filter(Boolean)
          : []
      } else {
        plainValues[k] = v
      }
    }

    const data = await run({ ...constants, ...unflattenValues(plainValues), ...arrayData })
    if (data !== null) {
      if (handleResult?.(data)) {
        // side effect handled navigation/rendering itself
      } else if (onSuccess) {
        onSuccess()
      } else if (renderResult || shouldAutoRender(data)) {
        setResult(data)
      } else {
        notify(formatResult(data), 'success')
      }
    }
  }

  const autoExecuted = useRef(false)
  useEffect(() => {
    if (isLeaf && items.length === 0 && !autoExecuted.current) {
      autoExecuted.current = true
      void run({ ...constants }).then((data) => {
        if (data !== null) {
          if (onSuccess) onSuccess()
          else if (shouldAutoRender(data)) setResult(data)
          else notify(formatResult(data), 'success')
        }
      })
    }
  }, [])

  const onChange = (key: string, value: FieldValue) => {
    setValues((prev) => ({ ...prev, [key]: value }))
    setLocalError(null)
    clearError()
  }

  useInput((input, key) => {
    if (key.escape || (!editingText && matchesCode(input, key, keybindings.back.code))) {
      onBack()
      return
    }
    if (matchesCode(input, key, keybindings.select.code)) {
      if (isLeaf) void onSubmit()
      else if (currentItem?.kind === 'sub') onSelect(currentItem.node.path)
      return
    }
    if (focused?.type === 'toggle' && matchesCode(input, key, keybindings.toggle.code)) {
      onChange(focused.key, values[focused.key] !== true)
    }
  })

  const headerDescription = t(
    (action
      ? `cmd.${tool.id}.${action}.description`
      : `cmd.${tool.id}.description`) as TranslationKey
  )

  const footerKeys: KeyHint[] = [
    { key: keybindings.navigate.label, label: t('tui.key.navigate') },
    ...(focused ? fieldKeyHints(focused, Boolean(fieldSuggestions?.[focused.key])) : []),
    { key: keybindings.select.label, label: isLeaf ? t('tui.key.submit') : t('tui.key.select') },
    { key: editingText ? 'esc' : `esc/${keybindings.back.label}`, label: t('tui.key.back') },
  ]

  const displayError = localError ?? execError
  const footerInfo = fieldInfo ?? focused?.description

  return (
    <Box flexDirection="column">
      <Header
        title={tool.id}
        subtitle={action?.split('.').join(' › ')}
        description={headerDescription}
      />

      <Selector
        items={items}
        cursor={cursor}
        onCursorChange={setCursor}
        isSelectable={(item) => item.kind === 'sub' || item.field.type !== 'group-header'}
        keyExtractor={(item) => (item.kind === 'sub' ? item.node.path : item.field.key)}
        renderItem={(item, selected) => {
          if (item.kind === 'sub') {
            const desc = t(`cmd.${tool.id}.${item.node.path}.description` as TranslationKey)
            return (
              <Box gap={3} paddingLeft={2}>
                <Box minWidth={subWidth}>
                  <Text {...(selected ? { color: colors.primary } : dim)}>{item.node.segment}</Text>
                </Box>
                {desc && (
                  <Text {...(selected ? { color: colors.primary } : dim)}>{capitalize(desc)}</Text>
                )}
              </Box>
            )
          }
          return (
            <Field
              spec={item.field}
              value={values[item.field.key]}
              onChange={(v) => onChange(item.field.key, v)}
              focus={selected}
              labelWidth={labelWidth}
              onInfo={setFieldInfo}
              {...(fieldSuggestions?.[item.field.key] && {
                suggestOptions: fieldSuggestions[item.field.key],
              })}
            />
          )
        }}
      />

      {loading && (
        <Box marginTop={1} paddingLeft={2}>
          <Spinner label={t('tui.working')} />
        </Box>
      )}

      {!loading && result !== null && (
        <Box marginTop={1}>
          {renderResult ? renderResult(result) : <Block>{autoRenderResult(result)}</Block>}
        </Box>
      )}

      {!loading && displayError && (
        <Box marginTop={1}>
          <Block text={displayError} color={colors.danger} />
        </Box>
      )}

      <Box marginTop={1}>
        <Footer
          keys={footerKeys}
          flash={flash}
          {...(footerInfo !== undefined && {
            info: footerInfo,
            infoProps: { color: colors.info, italic: true },
          })}
        />
      </Box>
    </Box>
  )
}

function shouldAutoRender(data: unknown): boolean {
  if (data === null || typeof data !== 'object' || Array.isArray(data)) return false
  const vals = Object.values(data as Record<string, unknown>)
  return vals.some((v) => Array.isArray(v)) || vals.length > 1
}

function autoRenderResult(data: unknown): ReactNode {
  if (data === null || typeof data !== 'object' || Array.isArray(data)) return null
  const obj = data as Record<string, unknown>

  const arrayVal = Object.values(obj).find(
    (v): v is Record<string, unknown>[] =>
      Array.isArray(v) &&
      v.length > 0 &&
      v.every((item) => typeof item === 'object' && item !== null)
  )

  if (arrayVal !== undefined) {
    const rows = arrayVal.map((row) =>
      Object.fromEntries(
        Object.entries(row).map(([k, v]) => [
          k,
          Array.isArray(v) ? (v as string[]).join(', ') : String(v ?? ''),
        ])
      )
    )
    const allKeys = [...new Set(rows.flatMap((r) => Object.keys(r)))]
    const columns = allKeys.map((k) => ({ key: k, label: k }))
    return <Table columns={columns} rows={rows} />
  }

  return <JsonView data={data} />
}

function formatResult(data: unknown): string {
  return pickString(data) ?? JSON.stringify(data)
}
