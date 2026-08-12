import {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  EmbedBuilder,
  PermissionFlagsBits,
  SlashCommandBuilder,
} from 'discord.js'
import type { ChatInputCommandInteraction } from 'discord.js'
import { botEnv } from '@nbenhadi/mirror-config/bot-env'
import type { Command } from '../types/command.js'
import { cap, en, getT, localize } from '../i18n.js'
import { ACCEPT_BUTTON_ID } from '../lib/constants.js'

export const welcome: Command = {
  data: new SlashCommandBuilder()
    .setName('welcome')
    .setDescription(cap(en('bot.welcome.cmd.description')))
    .setDescriptionLocalizations(localize('bot.welcome.cmd.description'))
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

  async execute(interaction: ChatInputCommandInteraction) {
    const tAdmin = getT(interaction.locale)
    const { DISCORD_WELCOME_CHANNEL_ID, DISCORD_MEMBER_ROLE_ID } = botEnv

    if (DISCORD_WELCOME_CHANNEL_ID === undefined) {
      await interaction.reply({
        content: cap(tAdmin('bot.welcome.cmd.no_channel')),
        ephemeral: true,
      })
      return
    }

    const channel = interaction.guild?.channels.cache.get(DISCORD_WELCOME_CHANNEL_ID)
    if (!channel?.isTextBased()) {
      await interaction.reply({
        content: cap(tAdmin('bot.welcome.cmd.no_channel')),
        ephemeral: true,
      })
      return
    }

    const description = cap(en('bot.welcome.intro'))

    const embed = new EmbedBuilder()
      .setTitle(cap(en('bot.welcome.title')))
      .setDescription(description)
      .setColor(0x57f287)

    if (DISCORD_MEMBER_ROLE_ID !== undefined) {
      const button = new ButtonBuilder()
        .setCustomId(ACCEPT_BUTTON_ID)
        .setLabel(cap(en('bot.welcome.accept_button')))
        .setStyle(ButtonStyle.Success)

      const row = new ActionRowBuilder<ButtonBuilder>().addComponents(button)
      await channel.send({ embeds: [embed], components: [row] })
    } else {
      await channel.send({ embeds: [embed] })
    }

    await interaction.reply({ content: cap(tAdmin('bot.welcome.cmd.sent')), ephemeral: true })
  },
}
