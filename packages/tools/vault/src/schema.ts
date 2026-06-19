import { z } from 'zod'

const initSchema = z.object({
  action: z.literal('init'),
  masterPassword: z.string().min(8),
  path: z.string().optional(),
})

const unlockSchema = z.object({
  action: z.literal('unlock'),
  masterPassword: z.string().min(1),
  minutes: z.number().int().min(1).max(480).default(30),
})

const lockSchema = z.object({
  action: z.literal('lock'),
})

const pathSchema = z.object({
  action: z.literal('path'),
  newPath: z.string().optional(),
})

const addSchema = z.object({
  action: z.literal('add'),
  title: z.string().min(1).max(200),
  username: z.string().optional(),
  password: z.string().optional(),
  url: z.string().url().optional(),
  notes: z.string().max(2000).optional(),
  tags: z.array(z.string()).default([]),
})

const listSchema = z.object({
  action: z.literal('list'),
  search: z.string().optional(),
  tag: z.string().optional(),
})

const getSchema = z.object({
  action: z.literal('get'),
  title: z.string().min(1),
  showPassword: z.boolean().default(false),
})

const editSchema = z.object({
  action: z.literal('edit'),
  title: z.string().min(1),
  newTitle: z.string().min(1).max(200).optional(),
  username: z.string().optional(),
  password: z.string().optional(),
  url: z.string().url().optional(),
  notes: z.string().max(2000).optional(),
  tags: z.array(z.string()).optional(),
})

const deleteSchema = z.object({
  action: z.literal('delete'),
  title: z.string().min(1),
  force: z.boolean().default(false),
})

const restoreSchema = z.object({
  action: z.literal('restore'),
  title: z.string().min(1),
})

const trashSchema = z.object({
  action: z.literal('trash'),
})

const purgeSchema = z.object({
  action: z.literal('purge'),
  title: z.string().min(1).optional(),
})

const rekeySchema = z.object({
  action: z.literal('rekey'),
  currentPassword: z.string().min(1),
  newPassword: z.string().min(8),
})

export const schema = z.discriminatedUnion('action', [
  initSchema,
  unlockSchema,
  lockSchema,
  pathSchema,
  addSchema,
  listSchema,
  getSchema,
  editSchema,
  deleteSchema,
  restoreSchema,
  trashSchema,
  purgeSchema,
  rekeySchema,
])

export type VaultInput = z.infer<typeof schema>
