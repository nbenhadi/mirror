import { z } from 'zod'

const botEnvSchema = z.object({
  DISCORD_TOKEN: z.string().min(1),
  DISCORD_CLIENT_ID: z.string().min(1),
  DISCORD_GUILD_ID: z.string().min(1),
  DISCORD_WELCOME_CHANNEL_ID: z
    .string()
    .transform((v) => v || undefined)
    .optional(),
  DISCORD_MEMBER_ROLE_ID: z
    .string()
    .transform((v) => v || undefined)
    .optional(),
})

export const botEnv = botEnvSchema.parse(process.env)
export type BotEnv = z.infer<typeof botEnvSchema>
