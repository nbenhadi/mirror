import { z } from 'zod'

const generalSchema = z
  .object({
    lang: z.string().optional(),
  })
  .optional()

export const keybindingsSchema = z.object({
  quit: z.string(),
  back: z.string(),
  navigateUp: z.string(),
  navigateDown: z.string(),
  adjustLeft: z.string(),
  adjustRight: z.string(),
  select: z.string(),
  toggle: z.string(),
})

export const kdfParamsSchema = z.object({
  memoryCost: z.number().int().positive(),
  timeCost: z.number().int().positive(),
  parallelism: z.number().int().positive(),
})

export const vaultConfigSchema = z.object({
  path: z.string(),
  salt: z.string().optional(),
  kdf: kdfParamsSchema.optional(),
})

export const configSchema = z.object({
  version: z.literal(1).optional(),
  general: generalSchema,
  tui: z
    .object({
      keybindings: keybindingsSchema.partial().optional(),
    })
    .optional(),
  tools: z
    .object({
      vault: vaultConfigSchema.optional(),
    })
    .optional(),
})

export const editableConfigSchema = z.object({
  general: z
    .object({
      lang: z.string().optional(),
    })
    .optional(),
  tui: z
    .object({
      keybindings: keybindingsSchema.partial().optional(),
    })
    .optional(),
  tools: z
    .object({
      vault: z
        .object({
          path: z.string().optional(),
        })
        .optional(),
    })
    .optional(),
})

export type AppConfig = z.infer<typeof configSchema>
export type Keybindings = z.infer<typeof keybindingsSchema>
export type KdfParams = z.infer<typeof kdfParamsSchema>
export type VaultConfig = z.infer<typeof vaultConfigSchema>
export type EditableConfig = z.infer<typeof editableConfigSchema>

export const PROTECTED_PATHS = ['version', 'tools.vault.salt', 'tools.vault.kdf'] as const

export const CONFIG_DEFAULTS = {
  general: {
    lang: 'en',
  },
  tui: {
    keybindings: {
      quit: 'ctrl+c',
      back: 'q',
      navigateUp: 'arrowUp',
      navigateDown: 'arrowDown',
      adjustLeft: 'arrowLeft',
      adjustRight: 'arrowRight',
      select: 'return',
      toggle: 'space',
    },
  },
} as const

export const KEYBINDINGS_DEFAULTS = CONFIG_DEFAULTS.tui.keybindings
