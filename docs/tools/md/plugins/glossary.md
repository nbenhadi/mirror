# glossary plugin

Turns a markdown table wrapped in `:::glossary` into a glossary: fills in the page each term first appears on, sorts entries by that page, and can drop terms nobody ended up using. The table stays plain GFM markdown, nothing extra to learn to write one.

Activate in front matter:

```yaml
---
plugins:
  - glossary
---
```

See [plugin activation](../README.md#plugins) for the general activation syntax.

## Example

```text
:::glossary{prune=true skipPages=2}
| Term   | Definition                               | Page |
| ------ | ---------------------------------------- | ---- |
| API    | Application programming interface        |      |
| Vault  | Encrypted credential store               |      |
| Legacy | Never actually used in the document      |      |
:::

## Architecture

The system exposes a REST API.

## Security

Credentials live in the Vault, encrypted at rest.
```

After export, the table comes back with `Legacy` dropped (it's never mentioned outside its own row), `Page` filled in with real numbers, and rows sorted by that page:

| Term  | Definition                        | Page |
| ----- | --------------------------------- | ---- |
| API   | Application programming interface | 2    |
| Vault | Encrypted credential store        | 3    |

Your `.md` source is never rewritten: the table above is what the export/preview looks like, the file on disk keeps the original rows, order, and empty `Page` column exactly as written.

### Any column name, any position

The page column doesn't have to be called `Page`, or be last. `pageColumn` points at it by position (1-based), the header text itself is never read:

```text
:::glossary{pageColumn=2}
| Term  | p.  | Definition                 |
| ----- | --- | -------------------------- |
| Vault |     | Encrypted credential store |
:::
```

Here `pageColumn=2` tells the plugin the second column is the one to fill in, whatever it's called. The term is still always the first column.

## Config

Set on the directive: `:::glossary{pageColumn=3 skipPages=1-2,14 prune=true}`.

| Field        | Type      | Default                          | Description                                                        |
| ------------ | --------- | -------------------------------- | ------------------------------------------------------------------ |
| `pageColumn` | `number`  | last column, if the table has 3+ | Column to fill in (1-based)                                        |
| `skipPages`  | `string`  | none                             | Pages to ignore when searching, e.g. `1-2,14`                      |
| `prune`      | `boolean` | `false`                          | Drop rows for terms never used outside the glossary                |
| `highlight`  | `boolean` | `true`                           | Mark each occurrence with `.glossary-term` (see [Markup](#markup)) |

## Markup

Each occurrence used to resolve a page gets wrapped, in place, with nothing else about the surrounding text touched:

```html
<span id="glossary-term-vault-0" class="glossary-term" data-term="vault">Vault</span>
```

| Selector           | What it controls                                                                  |
| ------------------ | --------------------------------------------------------------------------------- |
| `.glossary-term`   | Every occurrence. Unstyled by default, see [default theme](../themes/default.md). |
| `[data-term="id"]` | Slugified term (e.g. `vault`), to target one term specifically.                   |

The term itself is never a link, never clickable. A separate zero-size invisible link sits right after it, just to give the pdf a real destination. No visual presence, not part of `.glossary-term`.

`highlight=false` drops `class`/`data-term` (id + hidden link stay), so occurrences render as plain text even in a theme that styles `.glossary-term`.

## How matching works

- Term is always column 1. The leftover column is the definition.
- Matches whole words only, case-insensitive (`Vault` matches `vault`/`VAULT`, not `vaulting`). Keeps the original casing in the body.
- Picks the earliest occurrence outside `skipPages`.
- `pageColumn`/`skipPages` need `format: 'pdf'` and a second export pass, same as [toc](toc.md): render, read real pdf links, render again. `prune` alone works in one pass, any format.
