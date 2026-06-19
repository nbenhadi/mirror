import { z } from 'zod'

export const generateSchema = z.object({
  action: z.literal('generate'),
  length: z.number().int().min(8).max(128).default(16),
  uppercase: z.boolean().default(true),
  numbers: z.boolean().default(true),
  symbols: z.boolean().default(false),
  excludeAmbiguous: z.boolean().default(false),
  requireEach: z.boolean().default(false),
  noRepeat: z.boolean().default(false),
  exclude: z.string().optional(),
  include: z.string().optional(),
  separator: z
    .object({
      char: z.string().length(1),
      every: z.number().int().min(1).max(128),
    })
    .optional(),
  prefix: z.string().optional(),
  suffix: z.string().optional(),
})

export const schema = generateSchema

export type PasswordInput = z.infer<typeof schema>
