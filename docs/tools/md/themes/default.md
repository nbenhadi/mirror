# Default theme

Bundled theme with soft modern layout. Configurable paper and accent colors via front matter (`paper:`, `accent:`).

Margins: 80px horizontal, 50px vertical.

## Colors

Custom properties, set per `paper`/`accent` front matter value, reusable in a custom theme layered on top:

| Property        | Controls                                                                     |
| --------------- | ---------------------------------------------------------------------------- |
| `--paper`       | Page background                                                              |
| `--ink`         | Primary text color                                                           |
| `--ink-muted`   | Secondary/muted text (dates, footers, captions)                              |
| `--accent`      | Accent color (links, h2, list markers)                                       |
| `--accent-ink`  | Darker accent, for text on an `--accent-soft` background                     |
| `--accent-soft` | Light accent tint, used as a background (h1 badge, blockquote, table header) |
| `--border`      | Hairline borders (tables, hr, footer rule)                                   |
| `--code-bg`     | Background for `code`/`pre`                                                  |

### Paper

| `paper` | `--paper` |
| ------- | --------- |
| `white` | `#ffffff` |
| `cream` | `#fbf8f2` |
| `grey`  | `#f7f7f8` |

### Accent

| `accent` | `--ink`   | `--ink-muted` | `--accent` | `--accent-ink` | `--accent-soft` | `--border` | `--code-bg` |
| -------- | --------- | ------------- | ---------- | -------------- | --------------- | ---------- | ----------- |
| `indigo` | `#23222b` | `#6b6878`     | `#4b3f8f`  | `#2f265f`      | `#e9e6f4`       | `#dfdbea`  | `#f2f1f7`   |
| `rust`   | `#26221f` | `#756c64`     | `#b5502f`  | `#7a3115`      | `#f4e4d9`       | `#e8ddd1`  | `#f5efe6`   |
| `amber`  | `#1c2230` | `#5e697b`     | `#b9821f`  | `#6e4c0f`      | `#f5e9d0`       | `#e2e4e9`  | `#f4f2ec`   |
| `plum`   | `#241f24` | `#736e78`     | `#7a3b56`  | `#4c1f31`      | `#f3e3e9`       | `#e8dfe3`  | `#f5f0f2`   |
| `blue`   | `#1e232a` | `#5f6a76`     | `#2563a8`  | `#12385f`      | `#e2edf7`       | `#dfe4ea`  | `#f0f2f5`   |

## Directives

| Class       | Use as               | Does                                                     |
| ----------- | -------------------- | -------------------------------------------------------- |
| `columns`   | `:::columns ... :::` | Two-column flex layout, pair with `main`/`side` children |
| `main`      | inside `columns`     | Wider column                                             |
| `side`      | inside `columns`     | Narrower column                                          |
| `row`       | `:::row ... :::`     | Flex row, equal-width children                           |
| `center`    | `:::center ... :::`  | Center-aligns text                                       |
| `left`      | `:::left ... :::`    | Left-aligns text                                         |
| `right`     | `:::right ... :::`   | Right-aligns text                                        |
| `justify`   | `:::justify ... :::` | Justifies text                                           |
| `landscape` | `::landscape ... ::` | Renders the block as a landscape A4 page (pdf)           |

`::pagebreak` forces a page break in this theme (`.pagebreak { break-after: page }` is defined).

Ships css for the [toc plugin](../plugins/toc.md):

- dotted leader between title and page number
- top-level entries are bold
- every level shares the same color and font size (only weight tells them apart)
