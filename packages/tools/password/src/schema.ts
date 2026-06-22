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

export const schema = generateSchema

export type PasswordInput = z.infer<typeof schema>
