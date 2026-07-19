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

Input: `title` (required), optional `username`, `password`, `url`, `notes`, `tags` (string array).

### list

Lists all non-trashed entries.

Input: optional `search` (matches title or username), optional `tag`.

### get

Returns a single entry by exact title match, including the password.

Input: `title`.

### edit

Updates fields of an existing entry.

Input: `title` (required), optional `newTitle`, `username`, `password`, `url`, `notes`, `tags`.

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
