# Bot reference

Discord bot. Exposes tools as slash commands. All replies are ephemeral.

## Setup

1. Create a Discord Application at [discord.com/developers](https://discord.com/developers/applications).
2. Under "Bot", generate the token. Enable "Server Members Intent" under Privileged Gateway Intents.
3. Under "OAuth2 > URL Generator", select scopes `bot` and `applications.commands`, permission `Manage Messages`. Open the generated URL to invite the bot to your server.
4. Enable Developer Mode in Discord (Settings > Advanced) and right-click your server to copy the guild ID.
5. Fill in `.env`:

```
DISCORD_TOKEN=
DISCORD_CLIENT_ID=
DISCORD_GUILD_ID=
```

## Running locally

Build workspace packages first, then:

```bash
pnpm --filter @nbenhadi/mirror-bot register
pnpm --filter @nbenhadi/mirror-bot dev
```

Run `register` again whenever slash commands change. The bot uses guild commands, so changes take effect immediately.

## Commands

Tool-backed commands are documented in [docs/tools/](../tools/).
Bot-specific commands and features: [docs/apps/bot/](bot/)

## Deployment

Not configured yet. Target: Raspberry Pi or spare machine with PM2.

```bash
pnpm --filter @nbenhadi/mirror-bot build
node apps/bot/dist/index.js
```
