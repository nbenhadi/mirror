import { botEnv } from '@nbenhadi/mirror-config'
import { REST, Routes } from 'discord.js'
import type { RESTPostAPIApplicationCommandsJSONBody } from 'discord.js'
import { commands } from './lib/commands.js'

const rest = new REST().setToken(botEnv.DISCORD_TOKEN)
const body: RESTPostAPIApplicationCommandsJSONBody[] = [...commands.values()].map(
  (cmd) => cmd.data.toJSON() as RESTPostAPIApplicationCommandsJSONBody
)

await rest.put(Routes.applicationGuildCommands(botEnv.DISCORD_CLIENT_ID, botEnv.DISCORD_GUILD_ID), {
  body,
})

console.log(`${String(body.length)} command(s) registered to guild ${botEnv.DISCORD_GUILD_ID}`)
