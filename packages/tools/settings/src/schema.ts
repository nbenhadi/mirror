import { z } from 'zod'
import { EDITABLE_FIELDS } from './fields.js'

const keys = EDITABLE_FIELDS.map((f) => f.key) as [string, ...string[]]

const getSchema = z.object({
  action: z.literal('get'),
  key: z.enum(keys).describe('cmd.settings.get.opt.key'),
})

const setSchema = z.object({
  action: z.literal('set'),
  key: z.enum(keys).describe('cmd.settings.set.opt.key'),
  value: z.string().min(1).describe('cmd.settings.set.opt.value'),
})

const resetSchema = z.object({
  action: z.literal('reset'),
  key: z
    .union([z.enum(keys), z.literal('all')])
    .optional()
    .describe('cmd.settings.reset.opt.key'),
  apply: z.boolean().default(true),
})

const listSchema = z.object({
  action: z.literal('list'),
})

export const schema = z.discriminatedUnion('action', [
  getSchema,
  setSchema,
  resetSchema,
  listSchema,
])

export type ConfigInput = z.infer<typeof schema>
