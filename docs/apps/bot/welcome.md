# Welcome system

Posts a persistent welcome message with a "Get access" button in the configured channel. Members click the button to receive the `MEMBER` role and unlock the server.

## How it works

1. Admin runs `/welcome` once.
2. Bot posts an embed with a "Get access" button in `DISCORD_WELCOME_CHANNEL_ID`.
3. New members see only that channel (because `@everyone` has no access elsewhere).
4. Member clicks the button and receives the `DISCORD_MEMBER_ROLE_ID` role.

## Configuration

Set these in `.env`:

| Variable                     | Required | Description                                     |
| ---------------------------- | -------- | ----------------------------------------------- |
| `DISCORD_WELCOME_CHANNEL_ID` | Yes      | Channel where the welcome message is posted     |
| `DISCORD_MEMBER_ROLE_ID`     | No       | Role assigned when the member clicks the button |

## Discord server setup

1. Edit `@everyone` role: disable "View Channels".
2. In `#welcome` channel permissions: allow `@everyone` to view.
3. All other channels: allow only `MEMBER` to view.
4. Bot role must be above `MEMBER` in the role hierarchy (required to assign it).

## Notes

- No privileged intents needed. The system is fully button-driven.
- Re-running `/welcome` posts a new message, it does not replace the previous one.
- `/welcome` is admin only (`Administrator` permission required).
