# Markdown tool

Package: `@nbenhadi/mirror-md`

Provides markdown editing, exporting to PDF/HTML/PNG, slide decks (PDF/HTML), importing from Word/HTML, and theme management.

## Actions

### export

Exports markdown document to PDF, HTML, or PNG.

#### Input

| Field    | Type                       | Default     | Description                                        |
| -------- | -------------------------- | ----------- | -------------------------------------------------- |
| `path`   | `string`                   | -           | Path to .md file                                   |
| `format` | `'pdf' \| 'html' \| 'png'` | -           | Output format                                      |
| `output` | `string`                   | -           | Output path (optional, default: same dir as input) |
| `theme`  | `string`                   | `'default'` | Theme name                                         |
| `pages`  | `string`                   | -           | Page range for PDF (e.g. `'1-5,8'`)                |

#### Output

| Field  | Type     | Description           |
| ------ | -------- | --------------------- |
| `path` | `string` | Path to exported file |

#### Notes

- Markdown is parsed and rendered with theme styles applied.
- PDF margins are controlled by theme `margins` setting.
- Images must be referenced as relative paths from the document directory.

### import

Imports Word (.docx) or HTML file and converts to markdown.

#### Input

| Field    | Type     | Default | Description                                        |
| -------- | -------- | ------- | -------------------------------------------------- |
| `path`   | `string` | -       | Path to .docx or .html file                        |
| `output` | `string` | -       | Output path (optional, default: same dir as input) |

#### Output

| Field  | Type     | Description      |
| ------ | -------- | ---------------- |
| `path` | `string` | Path to .md file |

#### Notes

- Converts headings, lists, tables, links, and basic formatting.
- Images in Word are skipped; HTML images are referenced.
- Unsupported elements are converted to plain text.

### preview

Starts local HTTP server to preview markdown with live reload.

#### Input

| Field  | Type     | Default | Description                              |
| ------ | -------- | ------- | ---------------------------------------- |
| `path` | `string` | -       | Path to .md file                         |
| `port` | `number` | `0`     | HTTP server port (`0` picks a free port) |

#### Output

| Field | Type     | Description                              |
| ----- | -------- | ---------------------------------------- |
| `url` | `string` | Preview URL (e.g. http://localhost:3000) |

#### Notes

- Server automatically reloads when the markdown file changes.
- Assets (images, theme) are served relative to the document directory.

### edit

Opens markdown document in the system default editor, with a live preview server running alongside.

#### Input

| Field  | Type     | Default | Description                                    |
| ------ | -------- | ------- | ---------------------------------------------- |
| `path` | `string` | -       | Path to .md file (creates new file if missing) |
| `port` | `number` | `0`     | Preview server port (`0` picks a free port)    |

#### Output

| Field     | Type      | Description                             |
| --------- | --------- | --------------------------------------- |
| `path`    | `string`  | Path to edited file                     |
| `url`     | `string`  | Preview URL for the same document       |
| `created` | `boolean` | `true` if the file did not exist before |

### slides

Exports a Marp-flavored markdown slide deck to PDF or HTML.

#### Input

| Field    | Type              | Default | Description                                        |
| -------- | ----------------- | ------- | -------------------------------------------------- |
| `path`   | `string`          | -       | Path to .md file                                   |
| `output` | `string`          | -       | Output path (optional, default: same dir as input) |
| `format` | `'pdf' \| 'html'` | `'pdf'` | Output format                                      |
| `theme`  | `string`          | -       | Slide theme id, overrides the document frontmatter |

#### Output

| Field  | Type     | Description           |
| ------ | -------- | --------------------- |
| `path` | `string` | Path to exported file |

#### Notes

- Uses [Marp Core](https://github.com/marp-team/marp-core) for parsing and rendering, not the regular `remark` pipeline used by `export`.
- Slides are separated by `---` on its own line, following standard Marp syntax.
- `theme` accepts a slide theme id (see `theme.list --kind slide`). Falls back to the `theme:` frontmatter field in the document, then to Marp's own default.
- Plugins are not supported for slides.

### theme.list

Lists all available themes.

#### Input

| Field  | Type                    | Default      | Description                |
| ------ | ----------------------- | ------------ | -------------------------- |
| `kind` | `'document' \| 'slide'` | `'document'` | Which theme system to list |

#### Output

| Field    | Type               | Description    |
| -------- | ------------------ | -------------- |
| `themes` | `Array<ThemeInfo>` | List of themes |

ThemeInfo:

| Field         | Type     | Description             |
| ------------- | -------- | ----------------------- |
| `id`          | `string` | Theme identifier        |
| `description` | `string` | Theme description       |
| `source`      | `string` | `'bundled'` or `'user'` |

### theme.create

Creates a new custom theme.

#### Input

| Field         | Type                    | Default      | Description                           |
| ------------- | ----------------------- | ------------ | ------------------------------------- |
| `name`        | `string`                | -            | Theme identifier (kebab-case, unique) |
| `description` | `string`                | -            | Theme description                     |
| `kind`        | `'document' \| 'slide'` | `'document'` | Which theme system to create it under |

#### Output

| Field     | Type     | Description                |
| --------- | -------- | -------------------------- |
| `cssPath` | `string` | Path to generated CSS file |

#### Notes

- Opens the CSS file in the default editor for customization.
- `kind: 'document'` themes live at `~/.local/share/mirror/md/themes/<id>/theme.css` and `theme.json`.
- `kind: 'slide'` themes live at `~/.local/share/mirror/md/themes/slide/<id>/theme.css` and `theme.json`, in a separate namespace from document themes (a document theme and a slide theme can share the same id without colliding). A slide theme's CSS must declare `/* @theme <name> */` at the top, per Marp's own theme convention.
- Marp ships `default`, `gaia`, and `uncover` as built-in slide themes (`source: 'bundled'` in `theme.list --kind slide`), with no CSS file to manage.

### theme.edit

Opens an existing custom theme for editing.

#### Input

| Field  | Type                    | Default      | Description                      |
| ------ | ----------------------- | ------------ | -------------------------------- |
| `name` | `string`                | -            | Theme identifier                 |
| `kind` | `'document' \| 'slide'` | `'document'` | Which theme system it belongs to |

#### Output

| Field     | Type     | Description      |
| --------- | -------- | ---------------- |
| `cssPath` | `string` | Path to CSS file |

### theme.delete

Deletes a custom theme.

#### Input

| Field  | Type                    | Default      | Description                      |
| ------ | ----------------------- | ------------ | -------------------------------- |
| `name` | `string`                | -            | Theme identifier                 |
| `kind` | `'document' \| 'slide'` | `'document'` | Which theme system it belongs to |

## Markdown syntax

Supported markdown features:

- **Headings**: `# H1`, `## H2`, etc.
- **Text formatting**: `**bold**`, `_italic_`, `` `code` ``
- **Lists**: unordered with `-`, ordered with `1.`
- **Links**: `[text](url)`
- **Images**: `![alt](path/to/image.png)`
- **Code blocks**: ` ```lang code``` `
- **Tables**: GFM syntax
- **Blockquotes**: `> quote`
- **Horizontal rules**: `---`
- **Directives**: Custom containers with theme-specific CSS classes
- **Page breaks**: `::pagebreak`

### Directives

Container syntax defined by nesting depth. Each theme provides specific CSS classes you can use.

Syntax levels:

- `:class content :` - Single colon: inline
- `::class content ::` - Double colon: block container
- `:::class content :::` - Triple colon: themed block
- `::::class content ::::` - Quad colon: page-level (full-page layouts)

To use a directive, the theme must define its CSS class. Example:

```markdown
:::justify
Justified paragraph text here.
:::
```

See [themes/](themes/) for the directive classes each theme ships.

Custom themes: define classes in theme.css and use them as directive names.

### Front matter

YAML header for document metadata:

```yaml
---
title: Document Title
theme: default
paper: white
accent: indigo
header:
  left:
    - image: /path/to/logo.png
    - text: Company
  center: Document Title
  right: Confidential
footer:
  right: Page {{currentPage}}
---
```

Available fields:

| Field    | Type                        | Default   | Description                                                |
| -------- | --------------------------- | --------- | ---------------------------------------------------------- |
| `title`  | `string`                    | -         | Document title (for PDF metadata)                          |
| `theme`  | `string`                    | `default` | Theme to apply                                             |
| `paper`  | `string`                    | `white`   | Paper color (white, cream, grey)                           |
| `accent` | `string`                    | `indigo`  | Accent color theme                                         |
| `lang`   | `string`                    | `en`      | Document language                                          |
| `image`  | `object`                    | -         | Named images for header/footer (path or URL)               |
| `header` | `object`                    | -         | Header content (left, center, right, or images)            |
| `footer` | `object`                    | -         | Footer content (left, center, right, or images)            |
| `data`   | `object \| array \| string` | -         | Data source for the [template plugin](plugins/template.md) |

## Plugins

Plugins transform the document during `export`, `preview`, and `edit`. Not supported for `slides`.

Activate a plugin in front matter, by id, to turn it on for the whole document:

```yaml
---
plugins:
  - toc
---
```

An entry is a bundled plugin id, or a path to an external module exporting a plugin factory or plugin object as its default export. `plugins` only activates: config always lives on the plugin's own directive, never here.

Available plugins: [plugins/](plugins/).

## Themes

Bundled document themes: [themes/](themes/).

### Custom themes

Create document themes (`kind: 'document'`, the default) in `~/.local/share/mirror/md/themes/<id>/`:

- `theme.json`: metadata and margins
- `theme.css`: styling

Example theme.json:

```json
{
  "description": "My theme",
  "margins": { "x": 84, "y": 53 }
}
```

Margins in pixels control page margins in PDF and padding in HTML/PNG. **`margins` only applies to document themes.** Slides have no equivalent setting: Marp derives the slide size straight from `width`/`height` on `section` in the theme CSS and generates the matching PDF page size automatically, nothing to configure in `theme.json`.

### Slide themes

Create slide themes (`kind: 'slide'`) in `~/.local/share/mirror/md/themes/slide/<id>/`, same `theme.css` + `theme.json` structure, separate id namespace from document themes. `theme.css` must declare `/* @theme <id> */` at the top so Marp can register it: without it, Marp silently falls back to its own default theme instead of erroring.

`default`, `gaia`, and `uncover` come bundled from Marp itself (`theme.list --kind slide`), no CSS file needed for those three.

## Theme configuration

### theme.json

| Field         | Type     | Description                                                                     |
| ------------- | -------- | ------------------------------------------------------------------------------- |
| `description` | `string` | Human-readable theme description                                                |
| `margins`     | `object` | Page margins `{ x, y }` in pixels, **document themes only, ignored for slides** |

### theme.css

CSS file applied to all exports. Variables available:

- `--color-primary`, `--color-secondary`, etc. (theme-dependent)
- `--font-size-base`, `--font-size-h1`, etc.
- `--space-sm`, `--space-md`, `--space-lg`

Selectors:

- `body`: main content
- `h1`, `h2`, etc.: headings
- `.landscape`: landscape page
- `.columns`, `.row`: layout
- `img`, `table`, `blockquote`: elements

## Notes

- Paths are automatically trimmed of leading/trailing whitespace.
- Exports respect theme configuration for colors, fonts, and spacing.
- Header and footer placeholders: `{{currentPage}}`, `{{totalPage}}`.
