import {
  ActionRowBuilder,
  ModalBuilder,
  PermissionFlagsBits,
  SlashCommandBuilder,
  TextInputBuilder,
  TextInputStyle,
} from 'discord.js'
import type { ChatInputCommandInteraction } from 'discord.js'
import type { Command } from '../types/command.js'
import { cap, en, localize } from '../i18n.js'
import { SAY_CONTENT_ID, SAY_MODAL_PREFIX } from '../lib/constants.js'

export const say: Command = {
  data: new SlashCommandBuilder()
    .setName('say')
    .setDescription(cap(en('bot.say.description')))
    .setDescriptionLocalizations(localize('bot.say.description'))
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

  async execute(interaction: ChatInputCommandInteraction) {
    const modal = new ModalBuilder()
      .setCustomId(`${SAY_MODAL_PREFIX}:${interaction.channelId}`)
      .setTitle(cap(en('bot.say.modal.title')))

    const contentInput = new TextInputBuilder()
      .setCustomId(SAY_CONTENT_ID)
      .setLabel(cap(en('bot.say.modal.content.label')))
      .setStyle(TextInputStyle.Paragraph)
      .setRequired(true)
      .setMaxLength(2000)

    modal.addComponents(new ActionRowBuilder<TextInputBuilder>().addComponents(contentInput))

    await interaction.showModal(modal)
  },
}
