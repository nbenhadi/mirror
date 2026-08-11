import { z } from 'zod'

const PAGE_RANGE_PATTERN = /^\d+(-\d+)?(,\d+(-\d+)?)*$/

export const editSchema = z.object({
  action: z.literal('edit'),
  path: z.string().min(1).endsWith('.md').describe('cmd.md.edit.opt.path'),
  port: z.number().int().min(0).max(65535).default(0).describe('cmd.md.edit.opt.port'),
})

export const exportSchema = z.object({
  action: z.literal('export'),
  path: z.string().min(1).endsWith('.md').describe('cmd.md.export.opt.path'),
  output: z.string().optional().describe('cmd.md.export.opt.output'),
  format: z.enum(['pdf', 'html', 'png']).default('pdf').describe('cmd.md.export.opt.format'),
  theme: z.string().optional().describe('cmd.md.export.opt.theme'),
  pages: z.string().regex(PAGE_RANGE_PATTERN).optional().describe('cmd.md.export.opt.pages'),
})

export const importSchema = z.object({
  action: z.literal('import'),
  path: z.string().min(1).describe('cmd.md.import.opt.path'),
  output: z.string().optional().describe('cmd.md.import.opt.output'),
})

export const previewSchema = z.object({
  action: z.literal('preview'),
  path: z.string().min(1).endsWith('.md').describe('cmd.md.preview.opt.path'),
  port: z.number().int().min(0).max(65535).default(0).describe('cmd.md.preview.opt.port'),
})

export const themeCreateSchema = z.object({
  action: z.literal('theme.create'),
  name: z.string().min(1).describe('cmd.md.theme.create.opt.name'),
  description: z.string().optional().describe('cmd.md.theme.create.opt.description'),
})

export const themeListSchema = z.object({
  action: z.literal('theme.list'),
})

export const themeEditSchema = z.object({
  action: z.literal('theme.edit'),
  name: z.string().min(1).describe('cmd.md.theme.edit.opt.name'),
})

export const themeDeleteSchema = z.object({
  action: z.literal('theme.delete'),
  name: z.string().min(1).describe('cmd.md.theme.delete.opt.name'),
})

export const schema = z.discriminatedUnion('action', [
  editSchema,
  exportSchema,
  importSchema,
  previewSchema,
  themeCreateSchema,
  themeDeleteSchema,
  themeEditSchema,
  themeListSchema,
])

export type EditInput = z.infer<typeof editSchema>
export type ExportInput = z.infer<typeof exportSchema>
export type ImportInput = z.infer<typeof importSchema>
export type PreviewInput = z.infer<typeof previewSchema>
export type ThemeCreateInput = z.infer<typeof themeCreateSchema>
export type ThemeListInput = z.infer<typeof themeListSchema>
export type ThemeEditInput = z.infer<typeof themeEditSchema>
export type ThemeDeleteInput = z.infer<typeof themeDeleteSchema>
export type MdInput = z.infer<typeof schema>
