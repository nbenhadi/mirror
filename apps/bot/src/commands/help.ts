import { EmbedBuilder, SlashCommandBuilder } from 'discord.js'
import type {
  AutocompleteInteraction,
  ChatInputCommandInteraction,
  LocalizationMap,
} from 'discord.js'
import type { Command } from '../types/command.js'
import { cap, en, getT, localize } from '../i18n.js'
import { commands } from '../lib/commands.js'

type WithLocalizations = {
  description: string
  description_localizations?: Partial<Record<string, string | null | undefined>> | null | undefined
}

function localized(data: WithLocalizations, locale: string): string {
  return cap(data.description_localizations?.[locale] ?? data.description)
}

export const help: Command = {
  data: new SlashCommandBuilder()
    .setName('help')
    .setDescription(cap(en('bot.help.description')))
    .setDescriptionLocalizations(localize('bot.help.description') as LocalizationMap)
    .addStringOption((o) =>
      o
        .setName('command')
        .setDescription(cap(en('bot.help.opt.command')))
        .setDescriptionLocalizations(localize('bot.help.opt.command') as LocalizationMap)
        .setAutocomplete(true)
        .setRequired(false)
    ),

  async autocomplete(interaction: AutocompleteInteraction) {
    const focused = interaction.options.getFocused().toLowerCase()
    const choices = [...commands.keys()]
      .filter((name) => name.includes(focused))
      .map((name) => ({ name, value: name }))
    await interaction.respond(choices)
  },

  async execute(interaction: ChatInputCommandInteraction) {
    const t = getT(interaction.locale)
    const locale = interaction.locale as string
    const commandName = interaction.options.getString('command')

    if (commandName !== null) {
      const cmd = commands.get(commandName)
      if (!cmd) {
        await interaction.reply({
          content: cap(t('bot.help.not_found', { command: commandName })),
          ephemeral: true,
        })
        return
      }

      const apiData = cmd.data.toJSON()
      const embed = new EmbedBuilder()
        .setTitle(`\`/${cmd.data.name}\``)
        .setDescription(localized(apiData, locale))
        .setColor(0x5865f2)

      const options = apiData.options ?? []
      if (options.length > 0) {
        const optLines = options
          .map((opt) => `\`${opt.name}\` ${localized(opt as WithLocalizations, locale)}`)
          .join('\n')
        embed.addFields({ name: '​', value: optLines })
      }

      await interaction.reply({ embeds: [embed], ephemeral: true })
      return
    }

    const lines = [...commands.values()]
      .map((cmd) => `\`/${cmd.data.name}\` ${localized(cmd.data.toJSON(), locale)}`)
      .join('\n')

    const embed = new EmbedBuilder()
      .setTitle(cap(t('bot.help.title')))
      .setDescription(lines)
      .setColor(0x5865f2)

    await interaction.reply({ embeds: [embed], ephemeral: true })
  },
}
