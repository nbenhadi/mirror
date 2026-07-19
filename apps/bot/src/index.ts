import { botEnv } from '@nbenhadi/mirror-config/bot-env'
import { registry } from '@nbenhadi/mirror-core'
import { passwordTool } from '@nbenhadi/mirror-password'
import { Client, Events, GatewayIntentBits } from 'discord.js'
import { handleAutocomplete, handleCommand } from './lib/handler.js'
import { ACCEPT_BUTTON_ID } from './lib/constants.js'
import { handleAcceptRules } from './events/accept-rules.js'

registry.register(passwordTool)

const client = new Client({ intents: [GatewayIntentBits.Guilds] })

client.once(Events.ClientReady, (c) => {
  console.log(`Bot online: ${c.user.tag}`)
})

client.on(Events.InteractionCreate, (interaction) => {
  if (interaction.isButton() && interaction.customId === ACCEPT_BUTTON_ID) {
    void handleAcceptRules(interaction)
    return
  }
  if (interaction.isAutocomplete()) {
    void handleAutocomplete(interaction)
    return
  }
  if (!interaction.isChatInputCommand()) return
  void handleCommand(interaction)
})

await client.login(botEnv.DISCORD_TOKEN)
