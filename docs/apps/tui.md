# TUI reference

Launch the TUI with:

```bash
mir
```

## Navigation

The TUI is fully keyboard-driven.

| Key                      | Action                                  |
| ------------------------ | --------------------------------------- |
| Arrow Up / Arrow Down    | Navigate between items                  |
| Enter / Space            | Select or confirm                       |
| Q / Escape               | Go back or exit                         |
| Arrow Left / Arrow Right | Adjust a value (select fields)          |
| Ctrl+C                   | Quit (with confirmation on first press) |

## Screens

### Home

The home screen lists all available tools. Select one with arrow keys and press Enter.

### Tool screen

Each tool opens a form-based interface for its actions. If the tool requires authentication (e.g. master password), you are prompted before the action runs.

Results are displayed inline. Passwords and passphrases are copied to clipboard automatically.

### Back navigation

Press Q or Escape to go back to the previous screen at any point.

## Keybindings

Default keybindings can be changed via `mir-cli settings set` or through the settings tool in the TUI.

| Action        | Default key |
| ------------- | ----------- |
| Quit          | Ctrl+C      |
| Back          | Q           |
| Navigate up   | Arrow Up    |
| Navigate down | Arrow Down  |
| Adjust left   | Arrow Left  |
| Adjust right  | Arrow Right |
| Select        | Enter       |
| Toggle        | Space       |
