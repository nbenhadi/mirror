import type { AutocompleteInteraction, ChatInputCommandInteraction } from 'discord.js'
import { cap, getT } from '../i18n.js'
import { commands } from './commands.js'

export async function handleCommand(interaction: ChatInputCommandInteraction): Promise<void> {
  const command = commands.get(interaction.commandName)
  if (!command) return

  try {
    await command.execute(interaction)
  } catch (err) {
    const t = getT(interaction.locale)
    const content = cap(err instanceof Error ? err.message : t('error.execution'))
    if (interaction.replied || interaction.deferred) {
      await interaction.followUp({ content, ephemeral: true })
    } else {
      await interaction.reply({ content, ephemeral: true })
    }
  }
}

export async function handleAutocomplete(interaction: AutocompleteInteraction): Promise<void> {
  const command = commands.get(interaction.commandName)
  if (!command?.autocomplete) return
  try {
    await command.autocomplete(interaction)
  } catch {
    await interaction.respond([])
  }
}
