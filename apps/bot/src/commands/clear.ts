import { PermissionFlagsBits, SlashCommandBuilder } from 'discord.js'
import type {
  ChatInputCommandInteraction,
  Collection,
  GuildTextBasedChannel,
  Message,
} from 'discord.js'
import type { Command } from '../types/command.js'
import { cap, en, getT, localize } from '../i18n.js'

const FOURTEEN_DAYS = 14 * 24 * 60 * 60 * 1000

export const clear: Command = {
  data: new SlashCommandBuilder()
    .setName('clear')
    .setDescription(cap(en('bot.clear.description')))
    .setDescriptionLocalizations(localize('bot.clear.description'))
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageMessages)
    .addIntegerOption((o) =>
      o
        .setName('amount')
        .setDescription(cap(en('bot.clear.opt.amount')))
        .setDescriptionLocalizations(localize('bot.clear.opt.amount'))
        .setMinValue(1)
    )
    .addUserOption((o) =>
      o
        .setName('user')
        .setDescription(cap(en('bot.clear.opt.user')))
        .setDescriptionLocalizations(localize('bot.clear.opt.user'))
    ),

  async execute(interaction: ChatInputCommandInteraction) {
    const t = getT(interaction.locale)

    if (!interaction.guild || !interaction.channel) {
      await interaction.reply({ content: cap(t('bot.clear.not_in_guild')), ephemeral: true })
      return
    }

    const botMember = interaction.guild.members.me
    if (!botMember?.permissionsIn(interaction.channelId).has(PermissionFlagsBits.ManageMessages)) {
      await interaction.reply({ content: cap(t('bot.clear.no_permission')), ephemeral: true })
      return
    }

    await interaction.deferReply({ ephemeral: true })

    const amount = interaction.options.getInteger('amount') ?? undefined
    const user = interaction.options.getUser('user') ?? undefined
    const channel = interaction.channel as GuildTextBasedChannel
    const limit = amount ?? Infinity

    let deleted = 0
    let before: string | undefined = undefined

    while (deleted < limit) {
      const fetched = (await channel.messages.fetch(
        before !== undefined ? { limit: 100, before } : { limit: 100 }
      )) as Collection<string, Message<true>>

      if (fetched.size === 0) break

      let candidates = user ? fetched.filter((m) => m.author.id === user.id) : fetched

      const remaining = limit - deleted
      if (candidates.size > remaining) {
        const entries = [...candidates.values()].slice(0, remaining)
        candidates = candidates.filter((_, k) => entries.some((m) => m.id === k))
      }

      const now = Date.now()
      const recent = candidates.filter((m) => now - m.createdTimestamp < FOURTEEN_DAYS)
      const old = candidates.filter((m) => now - m.createdTimestamp >= FOURTEEN_DAYS)

      if (recent.size >= 2) {
        const result = await channel.bulkDelete(recent)
        deleted += result.size
      } else if (recent.size === 1) {
        await recent.first()?.delete()
        deleted++
      }

      for (const msg of old.values()) {
        await msg.delete()
        deleted++
      }

      before = fetched.last()?.id
      if (fetched.size < 100) break
    }

    await interaction.editReply(cap(t('bot.clear.success', { count: deleted })))
  },
}
