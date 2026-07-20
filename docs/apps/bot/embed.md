# /embed

Sends a rich embed as the bot in the current channel. Admin only.

## Usage

Run `/embed` in the channel where you want to post. A modal opens with five fields:

| Field       | Required | Max  | Description                          |
| ----------- | -------- | ---- | ------------------------------------ |
| `title`     | no       | 256  | Bold heading at the top of the embed |
| `content`   | yes      | 4000 | Body text, supports Discord markdown |
| `color`     | no       | -    | Hex color code, e.g. `#FF5500`       |
| `image url` | no       | -    | Full image displayed below content   |
| `footer`    | no       | 2048 | Small text at the bottom             |

## Notes

- Content supports Discord markdown: `**bold**`, `*italic*`, `` `code` ``, newlines, etc.
- Default color is blurple (`#5865F2`) when no color is provided or the hex is invalid.
- Image must be a direct URL to an image file.
- Discord modal limit is 5 inputs. Fields, author, thumbnail, and title URL are not supported.
- Requires `Administrator` permission.
