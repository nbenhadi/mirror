# toc plugin

Inserts a table of contents wherever `::toc` appears in the document. Collects every heading in the document, regardless of where `::toc` is placed.

Activate in front matter:

```yaml
---
plugins:
  - toc
---
```

See [plugin activation](../README.md#plugins) for the general activation syntax.

## Config

Set directly on the directive, per placement: `::toc{minDepth=1 maxDepth=2 pageNumbers=true}`.

| Field         | Type      | Default | Description                                      |
| ------------- | --------- | ------- | ------------------------------------------------ |
| `minDepth`    | `number`  | `2`     | Shallowest heading level included (`1` = h1)     |
| `maxDepth`    | `number`  | `3`     | Deepest heading level included                   |
| `pageNumbers` | `boolean` | `false` | Show the page each heading lands on (`pdf` only) |

## Example

```text
---
plugins:
  - toc
---

## Table of contents {.no-toc}

::toc{minDepth=2 maxDepth=3 pageNumbers=true}

::pagebreak

# Architecture

## Overview

## Deployment

::pagebreak

## Security
```

`::toc` collects every `##`/`###` heading in the document, wherever it's placed, and links each one to its own `#slug`. With `pageNumbers=true` and `format: 'pdf'`, each entry also gets the real page it lands on. `{.no-toc}` keeps the "Table of contents" heading itself out of the list it sits above.

## Markup

```html
<nav class="toc">
  <ol class="toc-list">
    <li class="toc-item" data-level="2" data-toc-level="0" style="--toc-level: 0">
      <a class="toc-link" href="#section-one">
        <span class="toc-title">Section one</span>
        <span class="toc-page">3</span>
      </a>
    </li>
  </ol>
</nav>
```

Nothing else is generated: no default css classes are shipped except through a theme (see [default theme](../themes/default.md)). Custom themes get this markup unstyled unless they define these selectors themselves.

| Selector           | Wraps                                   | What it controls                                                  |
| ------------------ | --------------------------------------- | ----------------------------------------------------------------- |
| `.toc`             | The whole `::toc` placement (a `<nav>`) | Container: spacing, background, border, max-width                 |
| `.toc-list`        | The entries (an `<ol>`)                 | List reset, border/radius if boxed                                |
| `.toc-item`        | One entry (an `<li>`)                   | Spacing between rows. Carries `data-level` (absolute depth)       |
| `[data-toc-level]` | Same `<li>`, relative depth attribute   | `0` for the shallowest level, `1` for the next, etc.              |
| `--toc-level`      | Same `<li>`, inline css custom property | Same depth as a number, for `calc()`-based indentation            |
| `.toc-link`        | The clickable row (an `<a href="#id">`) | Layout of title + page together: flex, alignment, gap             |
| `.toc-title`       | The heading text (a `<span>`)           | Text color/weight/size, and the leader between title and page     |
| `.toc-page`        | The page number (a `<span>`)            | Only present with `pageNumbers` + `pdf`. Color, weight, alignment |

## Notes

- Supports multiple `::toc` placements per document, each with its own config.
- Exclude a heading with `{.no-toc}`, e.g. `## Table of contents {.no-toc}`.
- `pageNumbers` (pdf only) costs a second export pass, but reads real pdf links, not a text search, so it stays accurate even with duplicate heading text.
