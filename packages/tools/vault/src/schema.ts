import { z } from 'zod'

const initSchema = z.object({
  action: z.literal('init'),
  masterPassword: z.string().min(8).describe('cmd.vault.init.opt.masterPassword'),
  path: z.string().optional().describe('cmd.vault.init.opt.path'),
})

const unlockSchema = z.object({
  action: z.literal('unlock'),
  masterPassword: z.string().min(1).describe('cmd.vault.unlock.opt.masterPassword'),
  minutes: z.number().int().min(1).max(480).default(30).describe('cmd.vault.unlock.opt.minutes'),
})

const lockSchema = z.object({
  action: z.literal('lock'),
})

const pathSchema = z.object({
  action: z.literal('path'),
  newPath: z.string().optional().describe('cmd.vault.path.opt.newPath'),
})

const addSchema = z.object({
  action: z.literal('add'),
  title: z.string().min(1).max(200).describe('cmd.vault.add.opt.title'),
  username: z.string().optional().describe('cmd.vault.add.opt.username'),
  password: z.string().optional().describe('cmd.vault.add.opt.password'),
  url: z.string().url().optional().describe('cmd.vault.add.opt.url'),
  notes: z.string().max(2000).optional().describe('cmd.vault.add.opt.notes'),
  tags: z.array(z.string()).default([]),
})

const listSchema = z.object({
  action: z.literal('list'),
  search: z.string().optional().describe('cmd.vault.list.opt.search'),
  tag: z.string().optional().describe('cmd.vault.list.opt.tag'),
})

const getSchema = z.object({
  action: z.literal('get'),
  title: z.string().min(1).describe('cmd.vault.get.opt.title'),
  showPassword: z.boolean().default(false).describe('cmd.vault.get.opt.showPassword'),
})

const editSchema = z.object({
  action: z.literal('edit'),
  title: z.string().min(1).describe('cmd.vault.edit.opt.title'),
  newTitle: z.string().min(1).max(200).optional().describe('cmd.vault.edit.opt.new_title'),
  username: z.string().optional().describe('cmd.vault.edit.opt.username'),
  password: z.string().optional().describe('cmd.vault.edit.opt.password'),
  url: z.string().url().optional().describe('cmd.vault.edit.opt.url'),
  notes: z.string().max(2000).optional().describe('cmd.vault.edit.opt.notes'),
  tags: z.array(z.string()).optional(),
})

const deleteSchema = z.object({
  action: z.literal('delete'),
  title: z.string().min(1).describe('cmd.vault.delete.opt.title'),
  force: z.boolean().default(false).describe('cmd.vault.delete.opt.force'),
})

const restoreSchema = z.object({
  action: z.literal('restore'),
  title: z.string().min(1).describe('cmd.vault.restore.opt.title'),
})

const trashSchema = z.object({
  action: z.literal('trash'),
})

const purgeSchema = z.object({
  action: z.literal('purge'),
  title: z.string().min(1).optional().describe('cmd.vault.purge.opt.title'),
})

const rekeySchema = z.object({
  action: z.literal('rekey'),
  currentPassword: z.string().min(1).describe('cmd.vault.rekey.opt.currentPassword'),
  newPassword: z.string().min(8).describe('cmd.vault.rekey.opt.newPassword'),
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
