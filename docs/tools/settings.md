# Settings tool

Package: `@nbenhadi/mirror-settings`

Reads and writes the app config file. All settings map to paths in the config JSON.

## Available settings

| Key                            | Default           | Options          | Description          |
| ------------------------------ | ----------------- | ---------------- | -------------------- |
| `general.lang`                 | `en`              | `en`, `es`, `fr` | Interface language   |
| `tui.keybindings.quit`         | `ctrl+c`          | any key string   | Quit the app         |
| `tui.keybindings.back`         | `q`               | any key string   | Go back              |
| `tui.keybindings.navigateUp`   | `arrowUp`         | any key string   | Move selection up    |
| `tui.keybindings.navigateDown` | `arrowDown`       | any key string   | Move selection down  |
| `tui.keybindings.adjustLeft`   | `arrowLeft`       | any key string   | Adjust value left    |
| `tui.keybindings.adjustRight`  | `arrowRight`      | any key string   | Adjust value right   |
| `tui.keybindings.select`       | `return`          | any key string   | Confirm selection    |
| `tui.keybindings.toggle`       | `space`           | any key string   | Toggle a value       |
| `tools.vault.path`             | platform data dir | any path         | Vault file directory |

## Actions

### get

Returns the current value of a setting key.

### set

Updates a setting key to a new value. The value is validated before writing.

Language changes take effect immediately in the TUI. Keybinding changes take effect immediately without restart.

### reset

Resets one or all settings to their defaults. Shows a diff preview of changes before applying.

Pass a specific key to reset only that setting. Pass no key (or `all`) to reset everything.

### list

Returns all current settings as a nested object.

## Protected keys

The following keys are managed internally and cannot be set or reset via the settings tool:

- `version`
- `tools.vault.salt`
- `tools.vault.kdf`
