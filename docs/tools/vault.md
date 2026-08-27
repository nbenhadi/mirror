# Vault tool

Package: `@nbenhadi/mirror-vault`

Manages an encrypted local credential store. All data is encrypted with AES-256-GCM using a key derived from the master password via Argon2id.

## Storage

The vault is a single encrypted JSON file. Default path:

- Linux: `~/.local/share/mirror/vault.enc`
- macOS: `~/Library/Application Support/mirror/vault.enc`
- Windows: `%APPDATA%/mirror/vault.enc`

The path is configurable with `vault path <newPath>` or `vault init --path <path>`.

## Session

After `vault unlock`, the derived key is held in memory for the duration of the session (default 30 minutes). Commands that require vault access auto-prompt for the master password if the session is expired.

## Actions

### init

Creates a new vault file. Fails if the file already exists at the target path.

Input: `masterPassword`, optional `path`.

### unlock

Unlocks the vault for a session.

Input: `masterPassword`, `minutes` (1-1440, default 30).

### lock

Clears the session immediately.

### path

Gets or sets the vault file path. Setting a new path moves the vault file.

Input: optional `newPath`.

### add

Adds a new entry.

Input: `title` (required), optional `username`, `password`, `url`, `notes`, `tags` (string array). Every tag must already exist (see [tags](#tags)): create it first with `tag.add`, otherwise the action fails.

### list

Lists all non-trashed entries.

Input: optional `search` (matches title or username), optional `tag`, optional `reveal` (default `false`).

By default passwords are masked. Pass `reveal: true` to show them in plaintext. This is opt-in per call, never persisted: the same risk tradeoff as `get`, but for every listed entry at once. Prefer `get` when you only need one password.

### get

Returns a single entry by exact title match, including the password.

Input: `title`.

### edit

Updates fields of an existing entry.

Input: `entry` (required, identifies which entry to edit), optional `title` (rename), `username`, `password`, `url`, `notes`, `tags`.

A field left out of the input is untouched. A field explicitly set to an empty string clears it (`username: ''` removes the username). `tags` follows a different rule since it is an array, not a string: omit it to leave tags untouched, pass `[]` to clear all tags, pass a list to replace them entirely. Every tag must already exist (see [tags](#tags)): create it first with `tag.add`, otherwise the action fails.

### delete

Moves an entry to the trash (soft delete). Pass `force: true` to permanently delete.

Input: `title`, optional `force`.

### restore

Restores a trashed entry.

Input: `title`.

### trash

Lists all trashed entries.

### purge

Permanently deletes entries from the trash.

Input: optional `title`. If omitted, purges all trashed entries.

### rekey

Changes the master password. Re-encrypts the entire vault with the new key.

Input: `currentPassword`, `newPassword`.

## Tags

Tags are shared across entries, matched case-insensitively. `add` and `edit` reuse the existing casing when a typed name already matches a known tag, but never create a new one: assigning a name that matches no tag fails with `tool.vault.error.tag_not_found`. Create a tag with `tag.add` before assigning it to an entry.

### tag.add

Creates a new tag with no entries attached yet, so it shows up as a suggestion before anything uses it.

Input: `name`.

### tag.list

Lists every tag with the number of active entries using it, including tags created via `tag.add` that no entry uses yet.

### tag.edit

Renames a tag. Every entry using the old name is updated to the new name.

Input: `name` (current), `newName`.

If `newName` already identifies another tag, the two tags merge: every entry that had either name ends up with just the target name.

### tag.delete

Deletes a tag. Every entry using it has the tag removed; the entries themselves are not affected.

Input: `name`.
