import { EmbedBuilder } from 'discord.js'
import type { ModalSubmitInteraction } from 'discord.js'
import { createTranslator } from '@nbenhadi/mirror-i18n'
import { cap, getT } from '../i18n.js'
import {
  EMBED_COLOR_ID,
  EMBED_CONTENT_ID,
  EMBED_FOOTER_ID,
  EMBED_IMAGE_ID,
  EMBED_MODAL_PREFIX,
  EMBED_TITLE_ID,
  SAY_CONTENT_ID,
  SAY_MODAL_PREFIX,
} from '../lib/constants.js'

const tEn = createTranslator('en')

export async function handleModalSend(interaction: ModalSubmitInteraction): Promise<void> {
  const { customId } = interaction
  const t = getT(interaction.locale)

  try {
    if (customId.startsWith(`${SAY_MODAL_PREFIX}:`)) {
      const channelId = customId.slice(SAY_MODAL_PREFIX.length + 1)
      const content = interaction.fields.getTextInputValue(SAY_CONTENT_ID)
      const channel = interaction.guild?.channels.cache.get(channelId)

      if (!channel?.isTextBased()) {
        await interaction.reply({ content: cap(tEn('bot.send.not_text_channel')), ephemeral: true })
        return
      }

      await channel.send({ content })
      await interaction.reply({ content: cap(t('bot.say.sent')), ephemeral: true })
      return
    }

    if (customId.startsWith(`${EMBED_MODAL_PREFIX}:`)) {
      const channelId = customId.slice(EMBED_MODAL_PREFIX.length + 1)
      const titleValue = interaction.fields.getTextInputValue(EMBED_TITLE_ID)
      const content = interaction.fields.getTextInputValue(EMBED_CONTENT_ID)
      const colorValue = interaction.fields.getTextInputValue(EMBED_COLOR_ID)
      const imageValue = interaction.fields.getTextInputValue(EMBED_IMAGE_ID)
      const footerValue = interaction.fields.getTextInputValue(EMBED_FOOTER_ID)
      const channel = interaction.guild?.channels.cache.get(channelId)

      if (!channel?.isTextBased()) {
        await interaction.reply({ content: cap(tEn('bot.send.not_text_channel')), ephemeral: true })
        return
      }

      const parsedColor = colorValue ? parseInt(colorValue.replace('#', ''), 16) : NaN
      const color = !isNaN(parsedColor) ? parsedColor : 0x5865f2

      const embedBuilder = new EmbedBuilder().setDescription(content).setColor(color)
      if (titleValue) embedBuilder.setTitle(titleValue)
      if (imageValue) embedBuilder.setImage(imageValue)
      if (footerValue) embedBuilder.setFooter({ text: footerValue })

      await channel.send({ embeds: [embedBuilder] })
      await interaction.reply({ content: cap(t('bot.embed.sent')), ephemeral: true })
    }
  } catch {
    const content = cap(tEn('error.execution'))
    if (interaction.replied || interaction.deferred) {
      await interaction.followUp({ content, ephemeral: true })
    } else {
      await interaction.reply({ content, ephemeral: true })
    }
  }
}
