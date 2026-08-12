# Markdown tool

Package: `@nbenhadi/mirror-md`

Provides markdown editing, exporting to PDF/HTML/PNG, importing from Word/HTML, and theme management.

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

### theme.list

Lists all available themes.

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

| Field | Type     | Description                           |
| ----- | -------- | ------------------------------------- |
| `id`  | `string` | Theme identifier (kebab-case, unique) |

#### Output

| Field     | Type     | Description                |
| --------- | -------- | -------------------------- |
| `cssPath` | `string` | Path to generated CSS file |

#### Notes

- Opens the CSS file in the default editor for customization.
- Theme structure: `~/.local/share/mirror/md/themes/<id>/theme.css` and `theme.json`.

### theme.edit

Opens an existing custom theme for editing.

#### Input

| Field  | Type     | Description      |
| ------ | -------- | ---------------- |
| `name` | `string` | Theme identifier |

#### Output

| Field     | Type     | Description      |
| --------- | -------- | ---------------- |
| `cssPath` | `string` | Path to CSS file |

### theme.delete

Deletes a custom theme.

#### Input

| Field  | Type     | Description      |
| ------ | -------- | ---------------- |
| `name` | `string` | Theme identifier |

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

Default theme provides: `justify`, `columns`, `row`, `center`, `left`, `right`.

CV theme provides: `justify`, `center`.

Custom themes: define classes in theme.css and use them as directive names.

### Page breaks

Insert `::pagebreak` to force a page break (theme must style with `break-after: page`).

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

| Field    | Type     | Default   | Description                                     |
| -------- | -------- | --------- | ----------------------------------------------- |
| `title`  | `string` | -         | Document title (for PDF metadata)               |
| `theme`  | `string` | `default` | Theme to apply                                  |
| `paper`  | `string` | `white`   | Paper color (white, cream, grey)                |
| `accent` | `string` | `indigo`  | Accent color theme                              |
| `lang`   | `string` | `en`      | Document language                               |
| `image`  | `object` | -         | Named images for header/footer (path or URL)    |
| `header` | `object` | -         | Header content (left, center, right, or images) |
| `footer` | `object` | -         | Footer content (left, center, right, or images) |

## Themes

### Default theme

Bundled theme with soft modern layout. Supports configurable paper (white, cream, grey) and accent (indigo, rust, amber, plum, blue) colors.

Margins: 80px horizontal, 50px vertical.

Supported directive classes: `justify`, `columns`, `row`, `center`, `left`, `right`.

### CV theme

Professional resume/CV theme. Clean, minimal design optimized for single-page documents.

Margins: 43px horizontal, 45px vertical.

Supported directive classes: `justify`, `center`.

### Custom themes

Create themes in `~/.local/share/mirror/md/themes/<id>/`:

- `theme.json`: metadata and margins
- `theme.css`: styling

Example theme.json:

```json
{
  "description": "My theme",
  "margins": { "x": 84, "y": 53 }
}
```

Margins in pixels control page margins in PDF and padding in HTML/PNG.

## Theme configuration

### theme.json

| Field         | Type     | Description                       |
| ------------- | -------- | --------------------------------- |
| `description` | `string` | Human-readable theme description  |
| `margins`     | `object` | Page margins `{ x, y }` in pixels |

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
