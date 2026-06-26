export type FieldValue = boolean | number | string

export type FieldValues = Record<string, FieldValue>

interface BaseField {
  key: string
  label: string
  description?: string
  indent?: boolean
}

export interface FieldGroupHeader extends BaseField {
  type: 'group-header'
}

export interface ToggleField extends BaseField {
  type: 'toggle'
  default: boolean
}

export interface NumberField extends BaseField {
  type: 'number'
  default: number
  min?: number
  max?: number
  step?: number
}

export interface TextField extends BaseField {
  type: 'text'
  default?: string
  mask?: boolean
  placeholder?: string
  maxLength?: number
}

export interface TextArrayField extends BaseField {
  type: 'text-array'
  default?: string
  placeholder?: string
  maxLength?: number
}

export interface SelectField extends BaseField {
  type: 'select'
  options: string[]
  default?: string
}

export type FieldSpec =
  | FieldGroupHeader
  | ToggleField
  | NumberField
  | TextField
  | TextArrayField
  | SelectField
