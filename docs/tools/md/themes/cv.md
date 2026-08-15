# CV theme

Professional resume/CV theme. Clean, minimal design optimized for single-page documents.

Margins: 43px horizontal, 45px vertical.

## Colors

Fixed, no `paper`/`accent` front matter support, no css custom properties exposed:

| Color           | Hex       | Used for                      |
| --------------- | --------- | ----------------------------- |
| Accent          | `#6a84f6` | h1, h2, blockquote border     |
| Text            | `#000000` | h1-h3, strong                 |
| Body            | `#767676` | list item text                |
| Muted           | `#535353` | paragraph and blockquote text |
| Date            | `#818ea1` | `.date`                       |
| Border          | `#e2e8f0` | table and hr borders          |
| Surface         | `#f8fafc` | table header background       |
| Code background | `#f1f5f9` | `code`/`pre` background       |

## Directives

| Class       | Use as                 | Does                                                     |
| ----------- | ---------------------- | -------------------------------------------------------- |
| `container` | `:::container ... :::` | Two-column flex layout, pair with `main`/`side` children |
| `main`      | inside `container`     | Wider column                                             |
| `side`      | inside `container`     | Narrower column                                          |
| `row`       | `:::row ... :::`       | Flex row, equal-width children                           |
| `center`    | `:::center ... :::`    | Center-aligns text                                       |
| `left`      | `:::left ... :::`      | Left-aligns text                                         |
| `right`     | `:::right ... :::`     | Right-aligns text                                        |
| `justify`   | `:::justify ... :::`   | Justifies text                                           |
