import { Command } from 'commander'
import { execute, type ToolError } from '@nbenhadi/mirror-core'
import { t } from '@nbenhadi/mirror-i18n'
import { MD_TOOL_ID, type ThemeListResult } from '@nbenhadi/mirror-md'
import chalk from 'chalk'
import * as ui from '../utils/ui.js'
import { openInBrowser } from '../utils/open-browser.js'
import { spawnEditor } from '../utils/spawn-editor.js'

function failFromError(error: ToolError): never {
  ui.fatal(t(error.message, error.params))
}

function createExportCommand(): Command {
  return new Command('export')
    .description(t('cmd.md.export.description'))
    .option('-p, --path <file>', t('cmd.md.export.opt.path'))
    .option('-o, --output <path>', t('cmd.md.export.opt.output'))
    .option('-f, --format <format>', t('cmd.md.export.opt.format'), 'pdf')
    .option('-t, --theme <name>', t('cmd.md.export.opt.theme'))
    .option('--pages <range>', t('cmd.md.export.opt.pages'))
    .action(async (options: Record<string, string | undefined>) => {
      if (!options.path) {
        ui.fatal(t('error.validation'))
        return
      }

      const result = await execute<{ path: string }>({
        toolId: MD_TOOL_ID,
        input: {
          action: 'export',
          path: options.path.trim(),
          format: (options.format || 'pdf').toLowerCase(),
          ...(options.output && { output: options.output.trim() }),
          ...(options.theme && { theme: options.theme }),
          ...(options.pages && { pages: options.pages }),
        },
      })

      if (!result.success) {
        failFromError(result.error)
      }

      ui.printSuccess(t('cmd.md.export.success', { path: chalk.blue(result.data.path) }))
    })
}

function createImportCommand(): Command {
  return new Command('import')
    .description(t('cmd.md.import.description'))
    .option('-p, --path <file>', t('cmd.md.import.opt.path'))
    .option('-o, --output <path>', t('cmd.md.import.opt.output'))
    .action(async (options: Record<string, string | undefined>) => {
      if (!options.path) {
        ui.fatal(t('error.validation'))
        return
      }

      const result = await execute<{ path: string }>({
        toolId: MD_TOOL_ID,
        input: {
          action: 'import',
          path: options.path.trim(),
          ...(options.output && { output: options.output.trim() }),
        },
      })

      if (!result.success) {
        failFromError(result.error)
      }

      ui.printSuccess(t('cmd.md.import.success', { path: chalk.blue(result.data.path) }))
    })
}

function createPreviewCommand(): Command {
  return new Command('preview')
    .description(t('cmd.md.preview.description'))
    .option('-p, --path <file>', t('cmd.md.preview.opt.path'))
    .option('--port <number>', t('cmd.md.preview.opt.port'), '3000')
    .action(async (options: Record<string, string | undefined>) => {
      if (!options.path) {
        ui.fatal(t('error.validation'))
        return
      }

      const port = parseInt(options.port || '3000', 10)

      const result = await execute<{ url: string }>({
        toolId: MD_TOOL_ID,
        input: {
          action: 'preview',
          path: options.path.trim(),
          port,
        },
      })

      if (!result.success) {
        failFromError(result.error)
      }

      ui.printSuccess(t('cmd.md.preview.success', { url: chalk.cyan(result.data.url) }))
      await openInBrowser(result.data.url)
    })
}

function createEditCommand(): Command {
  return new Command('edit')
    .description(t('cmd.md.edit.description'))
    .option('-p, --path <file>', t('cmd.md.edit.opt.path'))
    .action(async (options: Record<string, string | undefined>) => {
      if (!options.path) {
        ui.fatal(t('error.validation'))
        return
      }

      const result = await execute<{ path: string }>({
        toolId: MD_TOOL_ID,
        input: {
          action: 'edit',
          path: options.path.trim(),
        },
      })

      if (!result.success) {
        failFromError(result.error)
      }

      await spawnEditor(result.data.path)
      ui.printSuccess(t('cmd.md.edit.success'))
    })
}

function createSlidesCommand(): Command {
  return new Command('slides')
    .description(t('cmd.md.slides.description'))
    .option('-p, --path <file>', t('cmd.md.slides.opt.path'))
    .option('-o, --output <path>', t('cmd.md.slides.opt.output'))
    .option('-f, --format <format>', t('cmd.md.slides.opt.format'), 'pdf')
    .option('-t, --theme <name>', t('cmd.md.slides.opt.theme'))
    .action(async (options: Record<string, string | undefined>) => {
      if (!options.path) {
        ui.fatal(t('error.validation'))
        return
      }

      const result = await execute<{ path: string }>({
        toolId: MD_TOOL_ID,
        input: {
          action: 'slides',
          path: options.path.trim(),
          format: (options.format || 'pdf').toLowerCase(),
          ...(options.output && { output: options.output.trim() }),
          ...(options.theme && { theme: options.theme }),
        },
      })

      if (!result.success) {
        failFromError(result.error)
      }

      ui.printSuccess(t('cmd.md.slides.success', { path: chalk.blue(result.data.path) }))
    })
}

function createThemeListCommand(): Command {
  return new Command('list')
    .description(t('cmd.md.theme.list.description'))
    .option('-k, --kind <kind>', t('cmd.md.theme.list.opt.kind'), 'document')
    .action(async (options: Record<string, string | undefined>) => {
      const result = await execute<ThemeListResult>({
        toolId: MD_TOOL_ID,
        input: { action: 'theme.list', kind: options.kind },
      })

      if (!result.success) {
        failFromError(result.error)
      }

      const { themes } = result.data
      if (themes.length === 0) {
        ui.hint(t('cmd.md.theme.list.empty'))
        return
      }

      const rows = themes.map((theme) => {
        const source = theme.source === 'user' ? 'user' : 'bundled'
        return [theme.id, theme.description, chalk.dim(source)]
      })

      ui.table([t('id'), t('description'), t('source')], rows)
    })
}

function createThemeCreateCommand(): Command {
  return new Command('create')
    .description(t('cmd.md.theme.create.description'))
    .option('-n, --name <id>', t('cmd.md.theme.create.opt.name'))
    .option('-d, --description <text>', t('cmd.md.theme.create.opt.description'))
    .option('-k, --kind <kind>', t('cmd.md.theme.create.opt.kind'), 'document')
    .action(async (options: Record<string, string | undefined>) => {
      if (!options.name) {
        ui.fatal(t('error.validation'))
        return
      }

      const result = await execute<{ cssPath: string }>({
        toolId: MD_TOOL_ID,
        input: {
          action: 'theme.create',
          name: options.name,
          kind: options.kind,
          ...(options.description && { description: options.description }),
        },
      })

      if (!result.success) {
        failFromError(result.error)
      }

      ui.printSuccess(t('cmd.md.theme.create.success'))
      await spawnEditor(result.data.cssPath)
    })
}

function createThemeEditCommand(): Command {
  return new Command('edit')
    .description(t('cmd.md.theme.edit.description'))
    .option('-n, --name <id>', t('cmd.md.theme.edit.opt.name'))
    .option('-k, --kind <kind>', t('cmd.md.theme.edit.opt.kind'), 'document')
    .action(async (options: Record<string, string | undefined>) => {
      if (!options.name) {
        ui.fatal(t('error.validation'))
        return
      }

      const result = await execute<{ cssPath: string }>({
        toolId: MD_TOOL_ID,
        input: {
          action: 'theme.edit',
          name: options.name,
          kind: options.kind,
        },
      })

      if (!result.success) {
        failFromError(result.error)
      }

      await spawnEditor(result.data.cssPath)
      ui.printSuccess(t('cmd.md.theme.edit.success'))
    })
}

function createThemeDeleteCommand(): Command {
  return new Command('delete')
    .description(t('cmd.md.theme.delete.description'))
    .option('-n, --name <id>', t('cmd.md.theme.delete.opt.name'))
    .option('-k, --kind <kind>', t('cmd.md.theme.delete.opt.kind'), 'document')
    .action(async (options: Record<string, string | undefined>) => {
      if (!options.name) {
        ui.fatal(t('error.validation'))
        return
      }

      const result = await execute<Record<string, unknown>>({
        toolId: MD_TOOL_ID,
        input: {
          action: 'theme.delete',
          name: options.name,
          kind: options.kind,
        },
      })

      if (!result.success) {
        failFromError(result.error)
      }

      ui.printSuccess(t('cmd.md.theme.delete.success'))
    })
}

function createThemeCommand(): Command {
  return new Command('theme')
    .description(t('cmd.md.theme.description'))
    .addCommand(createThemeListCommand())
    .addCommand(createThemeCreateCommand())
    .addCommand(createThemeEditCommand())
    .addCommand(createThemeDeleteCommand())
}

export function createMdCommand(): Command {
  return new Command('md')
    .description(t('cmd.md.description'))
    .addCommand(createExportCommand())
    .addCommand(createImportCommand())
    .addCommand(createPreviewCommand())
    .addCommand(createEditCommand())
    .addCommand(createSlidesCommand())
    .addCommand(createThemeCommand())
}
