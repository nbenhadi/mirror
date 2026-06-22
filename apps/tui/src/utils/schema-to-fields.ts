import { t, type TranslationKey } from '@nbenhadi/mirror-i18n'
import type { FieldSpec, FieldValues } from '../types.js'

interface ZodCheck {
  kind: string
  value?: number
}

interface ZodDefLike {
  typeName: string
  innerType?: ZodTypeLike
  defaultValue?: () => unknown
  value?: unknown
  checks?: ZodCheck[]
  description?: string
  discriminator?: string
  discriminatorKey?: string
  options?: ZodTypeLike[]
  optionsMap?: Map<string, ZodTypeLike>
}

interface ZodTypeLike {
  _def: ZodDefLike
  shape?: Record<string, ZodTypeLike>
}

interface Unwrapped {
  inner: ZodTypeLike
  defaultValue: unknown
}

const WRAPPERS = new Set(['ZodDefault', 'ZodOptional', 'ZodNullable'])

function unwrap(ztype: ZodTypeLike): Unwrapped {
  let current = ztype
  let defaultValue: unknown
  while (WRAPPERS.has(current._def.typeName)) {
    if (current._def.typeName === 'ZodDefault' && current._def.defaultValue) {
      defaultValue = current._def.defaultValue()
    }
    if (!current._def.innerType) break
    current = current._def.innerType
  }
  return { inner: current, defaultValue }
}

function numberField(
  key: string,
  label: string,
  def: ZodDefLike,
  defaultValue: unknown,
  indent: boolean,
  outerDesc?: string
): FieldSpec {
  const checks = def.checks ?? []
  const min = checks.find((c) => c.kind === 'min')?.value
  const max = checks.find((c) => c.kind === 'max')?.value
  const autoDesc =
    min !== undefined && max !== undefined
      ? `${min}–${max}`
      : min !== undefined
        ? `≥${min}`
        : max !== undefined
          ? `≤${max}`
          : undefined
  const descKey = outerDesc ?? def.description
  return {
    type: 'number',
    key,
    label,
    default: typeof defaultValue === 'number' ? defaultValue : (min ?? 0),
    ...(indent && { indent }),
    ...(min !== undefined && { min }),
    ...(max !== undefined && { max }),
    ...(descKey !== undefined
      ? { description: t(descKey as TranslationKey) }
      : autoDesc !== undefined
        ? { description: autoDesc }
        : {}),
  }
}

function textField(
  key: string,
  label: string,
  def: ZodDefLike,
  defaultValue: unknown,
  indent: boolean,
  outerDesc?: string
): FieldSpec {
  const checks = def.checks ?? []
  const exactLen = checks.find((c) => c.kind === 'length')?.value
  const maxCheck = checks.find((c) => c.kind === 'max')?.value
  const maxLength = exactLen ?? maxCheck
  const autoDesc =
    exactLen !== undefined ? `${exactLen} char${exactLen !== 1 ? 's' : ''}` : undefined
  const descKey = outerDesc ?? def.description
  return {
    type: 'text',
    key,
    label,
    default: typeof defaultValue === 'string' ? defaultValue : '',
    ...(indent && { indent }),
    ...(maxLength !== undefined && { maxLength }),
    ...(key.toLowerCase().includes('password') && { mask: true }),
    ...(descKey !== undefined
      ? { description: t(descKey as TranslationKey) }
      : autoDesc !== undefined
        ? { description: autoDesc }
        : {}),
  }
}

function processShape(
  shape: Record<string, ZodTypeLike>,
  fields: FieldSpec[],
  constants: Record<string, unknown>,
  prefix = ''
): void {
  const indent = prefix !== ''

  for (const [rawKey, ztype] of Object.entries(shape)) {
    const key = prefix ? `${prefix}.${rawKey}` : rawKey
    const label = rawKey
    const outerDesc = ztype._def.description
    const { inner, defaultValue } = unwrap(ztype)
    const desc = outerDesc ?? inner._def.description

    switch (inner._def.typeName) {
      case 'ZodLiteral':
        if (!indent) constants[key] = inner._def.value
        break

      case 'ZodBoolean':
        fields.push({
          type: 'toggle',
          key,
          label,
          default: typeof defaultValue === 'boolean' ? defaultValue : false,
          ...(indent && { indent }),
          ...(desc !== undefined && { description: t(desc as TranslationKey) }),
        })
        break

      case 'ZodNumber':
        fields.push(numberField(key, label, inner._def, defaultValue, indent, desc))
        break

      case 'ZodString':
        fields.push(textField(key, label, inner._def, defaultValue, indent, desc))
        break

      case 'ZodArray': {
        const elem = (inner._def as { type?: ZodTypeLike }).type
        if (elem?._def?.typeName === 'ZodString') {
          fields.push({
            type: 'text-array',
            key,
            label,
            default: Array.isArray(defaultValue) ? (defaultValue as string[]).join(', ') : '',
            ...(indent && { indent }),
            ...(desc !== undefined && { description: t(desc as TranslationKey) }),
          })
        }
        break
      }

      case 'ZodObject':
        if (inner.shape) {
          fields.push({ type: 'group-header', key, label })
          processShape(inner.shape, fields, constants, key)
        }
        break

      default:
        break
    }
  }
}

export interface SchemaFields {
  fields: FieldSpec[]
  constants: Record<string, unknown>
}

export interface Subcommand {
  action: string
  schema: unknown
}

function getDiscriminatorKey(root: ZodTypeLike): string | undefined {
  return root._def.discriminator ?? root._def.discriminatorKey
}

function getUnionVariants(root: ZodTypeLike): ZodTypeLike[] {
  return (
    root._def.options ?? (root._def.optionsMap ? Array.from(root._def.optionsMap.values()) : [])
  )
}

export function getSubcommands(schema: unknown): Subcommand[] {
  const root = schema as ZodTypeLike

  if (root._def.typeName === 'ZodDiscriminatedUnion') {
    const key = getDiscriminatorKey(root)
    if (key === undefined) return []
    return getUnionVariants(root)
      .map((v) => ({ action: v.shape?.[key]?._def?.value as string, schema: v }))
      .filter((s) => s.action)
  }

  if (root._def.typeName === 'ZodObject' && root.shape) {
    const actionField = root.shape['action']
    if (actionField?._def?.typeName === 'ZodLiteral') {
      return [{ action: actionField._def.value as string, schema: root }]
    }
  }

  return []
}

export function getVariantSchema(schema: unknown, action: string): unknown {
  return getSubcommands(schema).find((s) => s.action === action)?.schema ?? schema
}

export function schemaToFields(schema: unknown): SchemaFields {
  const fields: FieldSpec[] = []
  const constants: Record<string, unknown> = {}

  const root = schema as ZodTypeLike
  if (root._def.typeName !== 'ZodObject' || !root.shape) {
    return { fields, constants }
  }

  processShape(root.shape, fields, constants)
  return { fields, constants }
}

export function initialValues(fields: FieldSpec[]): FieldValues {
  const values: FieldValues = {}
  for (const field of fields) {
    if (field.type === 'group-header') continue
    values[field.key] =
      field.type === 'text' || field.type === 'text-array' ? (field.default ?? '') : field.default
  }
  return values
}

export function unflattenValues(values: FieldValues): Record<string, unknown> {
  const result: Record<string, unknown> = {}
  for (const [key, value] of Object.entries(values)) {
    const dot = key.indexOf('.')
    if (dot === -1) {
      result[key] = value
    } else {
      const parent = key.slice(0, dot)
      const child = key.slice(dot + 1)
      if (typeof result[parent] !== 'object' || result[parent] === null) {
        result[parent] = {}
      }
      ;(result[parent] as Record<string, unknown>)[child] = value
    }
  }

  for (const key of Object.keys(result)) {
    const value = result[key]
    if (value === '') {
      delete result[key]
    } else if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
      const nested = value as Record<string, unknown>
      let hadEmpty = false
      for (const k of Object.keys(nested)) {
        if (nested[k] === '') {
          delete nested[k]
          hadEmpty = true
        }
      }
      if (Object.keys(nested).length === 0 || hadEmpty) delete result[key]
    }
  }

  return result
}
