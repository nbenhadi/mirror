export interface ConfigEntry {
  key: string
  value: unknown
  default: unknown
  isDefault: boolean
}

export interface ConfigDiffEntry {
  key: string
  before: unknown
  after: unknown
}

export interface GetOutput {
  key: string | undefined
  value: unknown
}

export interface SetOutput {
  key: string
  before: unknown
  after: unknown
}

export interface ResetOutput {
  action: 'reset'
  applied: boolean
  diff: {
    changes: ConfigDiffEntry[]
    hasChanges: boolean
  }
}

export interface ListOutput {
  action: 'list'
  settings: Record<string, unknown>
}

export type ConfigOutput = GetOutput | SetOutput | ResetOutput | ListOutput
