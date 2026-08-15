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

| Selector           | Wraps                                   | What it controls                                                                                                                                                                    |
| ------------------ | --------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `.toc`             | The whole `::toc` placement (a `<nav>`) | Container spacing, background, border, max-width. One per `::toc` in the document.                                                                                                  |
| `.toc-list`        | The entries (an `<ol>`)                 | List reset (`list-style`, `padding`), overall border/radius if the list itself is boxed.                                                                                            |
| `.toc-item`        | One entry (an `<li>`)                   | Per-row spacing (`margin-top` between entries). Also carries `data-level` (absolute heading depth, e.g. `2` for h2).                                                                |
| `[data-toc-level]` | Same `<li>`, relative depth attribute   | Depth relative to `minDepth`, `0` for the shallowest included level. Use `[data-toc-level="0"]` to target top-level entries specifically, regardless of what `minDepth` was set to. |
| `--toc-level`      | Same `<li>`, inline css custom property | Same relative depth as a number, meant for `calc()`, e.g. `padding-left: calc(var(--toc-level, 0) * 1.25em)` for indentation.                                                       |
| `.toc-link`        | The clickable row (an `<a href="#id">`) | Layout of title + page number together: `display: flex`, alignment, gap, removing the underline.                                                                                    |
| `.toc-title`       | The heading text (a `<span>`)           | Text color/weight/size, and the leader (e.g. a `border-bottom: dotted` that stretches to fill the row via `flex: 1`).                                                               |
| `.toc-page`        | The page number (a `<span>`)            | Only present when `pageNumbers` is on and the format is `pdf`. Empty on the first export pass, filled on the second. Color, weight, alignment of the number itself.                 |

## Notes

- Supports multiple `::toc` placements per document, each with its own config.
- Exclude a heading with `{.no-toc}`, e.g. `## Table of contents {.no-toc}`.
- `pageNumbers` (pdf only) costs a second export pass, but reads real pdf links, not a text search, so it stays accurate even with duplicate heading text.
