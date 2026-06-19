export const SUPPORTED_LOCALES = ['en', 'es', 'fr'] as const
export type Locale = (typeof SUPPORTED_LOCALES)[number]
export const DEFAULT_LOCALE: Locale = 'en'

export type TranslationKey =
  // System errors
  | 'error.validation'
  | 'error.not_found'
  | 'error.unauthorized'
  | 'error.forbidden'
  | 'error.execution'
  | 'error.crypto'
  | 'error.database'

  // CLI
  | 'cli.passwords_mismatch'
  | 'cli.cancelled'

  // Clipboard
  | 'clipboard.copied'
  | 'clipboard.unavailable'

  // Password tool
  | 'password.error.empty_charset'
  | 'password.error.not_enough_chars'

  // Vault lifecycle
  | 'vault.init.success'
  | 'vault.unlock.success'
  | 'vault.lock.success'
  | 'vault.rekey.success'

  // Vault entries
  | 'vault.add.success'
  | 'vault.list.empty'
  | 'vault.list.count_one'
  | 'vault.list.count_many'
  | 'vault.edit.success'
  | 'vault.delete.permanent'
  | 'vault.delete.trashed'
  | 'vault.restore.success'

  // Vault trash
  | 'vault.trash.empty'
  | 'vault.trash.count_one'
  | 'vault.trash.count_many'
  | 'vault.purge.success'
  | 'vault.purge.all_one'
  | 'vault.purge.all_many'
  | 'vault.purge.already_empty'

  // Program
  | 'program.description'

  // Prompts
  | 'prompt.master_password'
  | 'prompt.confirm_password'
  | 'prompt.current_password'
  | 'prompt.new_password'
  | 'prompt.confirm_new_password'
  | 'prompt.purge_all_confirm'

  // Table headers
  | 'table.title'
  | 'table.username'
  | 'table.url'
  | 'table.tags'
  | 'table.deleted_at'

  // Command: password
  | 'cmd.password.description'
  | 'cmd.password.generate.description'
  | 'cmd.password.generate.opt.length'
  | 'cmd.password.generate.opt.no_uppercase'
  | 'cmd.password.generate.opt.no_numbers'
  | 'cmd.password.generate.opt.symbols'
  | 'cmd.password.generate.opt.exclude_ambiguous'
  | 'cmd.password.generate.opt.require_each'
  | 'cmd.password.generate.opt.no_repeat'
  | 'cmd.password.generate.opt.exclude'
  | 'cmd.password.generate.opt.include'
  | 'cmd.password.generate.opt.separator'
  | 'cmd.password.generate.opt.every'
  | 'cmd.password.generate.opt.prefix'
  | 'cmd.password.generate.opt.suffix'

  // Command: vault
  | 'cmd.vault.description'
  | 'cmd.vault.init.description'
  | 'cmd.vault.init.opt.path'
  | 'cmd.vault.unlock.description'
  | 'cmd.vault.lock.description'
  | 'cmd.vault.path.description'
  | 'cmd.vault.add.description'
  | 'cmd.vault.add.opt.title'
  | 'cmd.vault.add.opt.username'
  | 'cmd.vault.add.opt.password'
  | 'cmd.vault.add.opt.url'
  | 'cmd.vault.add.opt.notes'
  | 'cmd.vault.add.opt.tags'
  | 'cmd.vault.list.description'
  | 'cmd.vault.list.opt.search'
  | 'cmd.vault.list.opt.tag'
  | 'cmd.vault.get.description'
  | 'cmd.vault.edit.description'
  | 'cmd.vault.edit.opt.new_title'
  | 'cmd.vault.edit.opt.username'
  | 'cmd.vault.edit.opt.password'
  | 'cmd.vault.edit.opt.url'
  | 'cmd.vault.edit.opt.notes'
  | 'cmd.vault.edit.opt.tags'
  | 'cmd.vault.delete.description'
  | 'cmd.vault.delete.opt.force'
  | 'cmd.vault.restore.description'
  | 'cmd.vault.trash.description'
  | 'cmd.vault.rekey.description'
  | 'cmd.vault.purge.description'
  | 'cmd.vault.purge.opt.yes'

  // Command: lang
  | 'cmd.lang.description'
  | 'cmd.lang.error.unsupported'
  | 'cmd.lang.success'

  // Commander UI
  | 'cmd.help.usage'
  | 'cmd.help.options'
  | 'cmd.help.commands'
  | 'cmd.help.version'
  | 'cmd.help.help_command'
  | 'cmd.help.display_help'
