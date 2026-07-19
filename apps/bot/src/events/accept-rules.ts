import type { ButtonInteraction, GuildMemberRoleManager } from 'discord.js'
import { botEnv } from '@nbenhadi/mirror-config'
import { cap, getT } from '../i18n.js'
import { createTranslator } from '@nbenhadi/mirror-i18n'

const tEn = createTranslator('en')

export async function handleAcceptRules(interaction: ButtonInteraction): Promise<void> {
  const { DISCORD_MEMBER_ROLE_ID } = botEnv

  if (DISCORD_MEMBER_ROLE_ID === undefined) {
    await interaction.reply({ content: cap(tEn('error.execution')), ephemeral: true })
    return
  }

  const roles = interaction.member?.roles
  if (!roles || Array.isArray(roles)) {
    await interaction.reply({ content: cap(tEn('error.execution')), ephemeral: true })
    return
  }

  const t = getT(interaction.locale)

  await (roles as GuildMemberRoleManager).add(DISCORD_MEMBER_ROLE_ID)
  await interaction.reply({ content: cap(t('bot.welcome.accepted')), ephemeral: true })
}
