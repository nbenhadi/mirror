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
import {
  EMBED_COLOR_ID,
  EMBED_CONTENT_ID,
  EMBED_FOOTER_ID,
  EMBED_IMAGE_ID,
  EMBED_MODAL_PREFIX,
  EMBED_TITLE_ID,
} from '../lib/constants.js'

export const embed: Command = {
  data: new SlashCommandBuilder()
    .setName('embed')
    .setDescription(cap(en('bot.embed.description')))
    .setDescriptionLocalizations(localize('bot.embed.description'))
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

  async execute(interaction: ChatInputCommandInteraction) {
    const modal = new ModalBuilder()
      .setCustomId(`${EMBED_MODAL_PREFIX}:${interaction.channelId}`)
      .setTitle(cap(en('bot.embed.modal.title')))

    const titleInput = new TextInputBuilder()
      .setCustomId(EMBED_TITLE_ID)
      .setLabel(cap(en('bot.embed.modal.title_field.label')))
      .setStyle(TextInputStyle.Short)
      .setRequired(false)
      .setMaxLength(256)

    const contentInput = new TextInputBuilder()
      .setCustomId(EMBED_CONTENT_ID)
      .setLabel(cap(en('bot.embed.modal.content.label')))
      .setStyle(TextInputStyle.Paragraph)
      .setRequired(true)
      .setMaxLength(4000)

    const colorInput = new TextInputBuilder()
      .setCustomId(EMBED_COLOR_ID)
      .setLabel(cap(en('bot.embed.modal.color.label')))
      .setStyle(TextInputStyle.Short)
      .setRequired(false)
      .setMaxLength(7)

    const imageInput = new TextInputBuilder()
      .setCustomId(EMBED_IMAGE_ID)
      .setLabel(cap(en('bot.embed.modal.image.label')))
      .setStyle(TextInputStyle.Short)
      .setRequired(false)

    const footerInput = new TextInputBuilder()
      .setCustomId(EMBED_FOOTER_ID)
      .setLabel(cap(en('bot.embed.modal.footer.label')))
      .setStyle(TextInputStyle.Short)
      .setRequired(false)
      .setMaxLength(2048)

    modal.addComponents(
      new ActionRowBuilder<TextInputBuilder>().addComponents(titleInput),
      new ActionRowBuilder<TextInputBuilder>().addComponents(contentInput),
      new ActionRowBuilder<TextInputBuilder>().addComponents(colorInput),
      new ActionRowBuilder<TextInputBuilder>().addComponents(imageInput),
      new ActionRowBuilder<TextInputBuilder>().addComponents(footerInput)
    )

    await interaction.showModal(modal)
  },
}
