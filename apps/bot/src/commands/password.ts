import { SlashCommandBuilder } from 'discord.js'
import type { ChatInputCommandInteraction, LocalizationMap } from 'discord.js'
import type { TranslationKey } from '@nbenhadi/mirror-i18n'
import { execute } from '@nbenhadi/mirror-core'
import type { Command } from '../types/command.js'
import { cap, en, getT, localize } from '../i18n.js'

const MIN_LENGTH = 8
const MAX_LENGTH = 128

export const password: Command = {
  data: new SlashCommandBuilder()
    .setName('password')
    .setDescription(cap(en('cmd.password.generate.description')))
    .setDescriptionLocalizations(localize('cmd.password.generate.description') as LocalizationMap)
    .addIntegerOption((o) =>
      o
        .setName('length')
        .setDescription(
          cap(en('cmd.password.generate.opt.length', { min: MIN_LENGTH, max: MAX_LENGTH }))
        )
        .setDescriptionLocalizations(
          localize('cmd.password.generate.opt.length', {
            min: MIN_LENGTH,
            max: MAX_LENGTH,
          }) as LocalizationMap
        )
        .setMinValue(MIN_LENGTH)
        .setMaxValue(MAX_LENGTH)
    )
    .addBooleanOption((o) =>
      o
        .setName('uppercase')
        .setDescription(cap(en('cmd.password.generate.opt.no_uppercase')))
        .setDescriptionLocalizations(
          localize('cmd.password.generate.opt.no_uppercase') as LocalizationMap
        )
    )
    .addBooleanOption((o) =>
      o
        .setName('numbers')
        .setDescription(cap(en('cmd.password.generate.opt.no_numbers')))
        .setDescriptionLocalizations(
          localize('cmd.password.generate.opt.no_numbers') as LocalizationMap
        )
    )
    .addBooleanOption((o) =>
      o
        .setName('symbols')
        .setDescription(cap(en('cmd.password.generate.opt.symbols')))
        .setDescriptionLocalizations(
          localize('cmd.password.generate.opt.symbols') as LocalizationMap
        )
    )
    .addBooleanOption((o) =>
      o
        .setName('exclude_ambiguous')
        .setDescription(cap(en('cmd.password.generate.opt.exclude_ambiguous')))
        .setDescriptionLocalizations(
          localize('cmd.password.generate.opt.exclude_ambiguous') as LocalizationMap
        )
    )
    .addBooleanOption((o) =>
      o
        .setName('require_each')
        .setDescription(cap(en('cmd.password.generate.opt.require_each')))
        .setDescriptionLocalizations(
          localize('cmd.password.generate.opt.require_each') as LocalizationMap
        )
    )
    .addBooleanOption((o) =>
      o
        .setName('no_repeat')
        .setDescription(cap(en('cmd.password.generate.opt.no_repeat')))
        .setDescriptionLocalizations(
          localize('cmd.password.generate.opt.no_repeat') as LocalizationMap
        )
    )
    .addStringOption((o) =>
      o
        .setName('exclude')
        .setDescription(cap(en('cmd.password.generate.opt.exclude')))
        .setDescriptionLocalizations(
          localize('cmd.password.generate.opt.exclude') as LocalizationMap
        )
    ),

  async execute(interaction: ChatInputCommandInteraction) {
    const t = getT(interaction.locale)
    const o = interaction.options

    const result = await execute<{ password: string }>({
      toolId: 'password',
      input: {
        action: 'generate',
        length: o.getInteger('length') ?? 16,
        uppercase: o.getBoolean('uppercase') ?? true,
        numbers: o.getBoolean('numbers') ?? true,
        symbols: o.getBoolean('symbols') ?? false,
        excludeAmbiguous: o.getBoolean('exclude_ambiguous') ?? false,
        requireEach: o.getBoolean('require_each') ?? false,
        noRepeat: o.getBoolean('no_repeat') ?? false,
        ...(o.getString('exclude') !== null ? { exclude: o.getString('exclude')! } : {}),
      },
    })

    if (!result.success) {
      const msg = cap(t(result.error.message as TranslationKey, result.error.params))
      await interaction.reply({ content: msg, ephemeral: true })
      return
    }

    await interaction.reply({ content: `\`\`\`\n${result.data.password}\n\`\`\``, ephemeral: true })
  },
}
