# /clear

Deletes messages from the current channel. Requires `Manage Messages` permission on the bot.

## Options

| Option   | Type    | Description                         |
| -------- | ------- | ----------------------------------- |
| `amount` | integer | Number of messages to delete        |
| `user`   | user    | Only delete messages from this user |

## Notes

- Messages older than 14 days are deleted one by one (Discord API limit on bulk delete).
- If `amount` is omitted, deletes all messages in the channel (up to API limits).
- Only members with `Manage Messages` permission can use this command (`setDefaultMemberPermissions`).
