import { z } from 'zod'

export const generateSchema = z.object({
  action: z.literal('generate'),
  length: z.number().int().min(8).max(128).default(16).describe('cmd.password.generate.opt.length'),
  uppercase: z.boolean().default(true).describe('cmd.password.generate.opt.no_uppercase'),
  numbers: z.boolean().default(true).describe('cmd.password.generate.opt.no_numbers'),
  symbols: z.boolean().default(false).describe('cmd.password.generate.opt.symbols'),
  excludeAmbiguous: z
    .boolean()
    .default(false)
    .describe('cmd.password.generate.opt.exclude_ambiguous'),
  requireEach: z.boolean().default(false).describe('cmd.password.generate.opt.require_each'),
  noRepeat: z.boolean().default(false).describe('cmd.password.generate.opt.no_repeat'),
  exclude: z.string().optional().describe('cmd.password.generate.opt.exclude'),
  include: z.string().optional().describe('cmd.password.generate.opt.include'),
  separator: z
    .object({
      char: z.string().length(1).describe('cmd.password.generate.opt.separator'),
      every: z.number().int().min(1).max(128).describe('cmd.password.generate.opt.every'),
    })
    .optional(),
  prefix: z.string().optional().describe('cmd.password.generate.opt.prefix'),
  suffix: z.string().optional().describe('cmd.password.generate.opt.suffix'),
})

export const checkSchema = z.object({
  action: z.literal('check'),
  password: z.string().min(1).describe('cmd.password.check.opt.password'),
})

export const passphraseSchema = z.object({
  action: z.literal('passphrase'),
  words: z.number().int().min(3).max(20).default(6).describe('cmd.password.passphrase.opt.words'),
  separator: z.string().default('-').describe('cmd.password.passphrase.opt.separator'),
  capitalize: z.boolean().default(false).describe('cmd.password.passphrase.opt.capitalize'),
  number: z.boolean().default(false).describe('cmd.password.passphrase.opt.number'),
})

export const schema = z.discriminatedUnion('action', [
  generateSchema,
  checkSchema,
  passphraseSchema,
])

export type PasswordInput = z.infer<typeof schema>
export type GenerateInput = z.infer<typeof generateSchema>
export type CheckInput = z.infer<typeof checkSchema>
export type PassphraseInput = z.infer<typeof passphraseSchema>
