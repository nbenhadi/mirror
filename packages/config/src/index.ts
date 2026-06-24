export { readConfig, patchConfig } from './io.js'
export { getConfigDir, getUserDataDir, getConfigPath } from './paths.js'
export { readConfigSync } from './sync.js'
export { deepMerge, isPlainObject } from './merge.js'
export type { DeepPartial } from './merge.js'
export {
  configSchema,
  editableConfigSchema,
  keybindingsSchema,
  kdfParamsSchema,
  vaultConfigSchema,
  PROTECTED_PATHS,
  CONFIG_DEFAULTS,
  KEYBINDINGS_DEFAULTS,
} from './schema.js'
export type { AppConfig, EditableConfig, Keybindings, KdfParams, VaultConfig } from './schema.js'
