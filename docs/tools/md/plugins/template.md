# template plugin

Fills a document from a data source: `{{field}}` for single values, `{{#each list}}...{{/each}}` to repeat a block once per record (a whole page, a table row, anything). Runs before the document is parsed as markdown, so anything repeated inside a loop, headings, tables, `::pagebreak`, other directives, works exactly like it would if you had typed it out by hand for every record.

Activate in front matter, with `data` pointing at the source:

```yaml
---
plugins:
  - template
data: patients.json
---
```

See [plugin activation](../README.md#plugins) for the general activation syntax.

## Example

`patients.json`:

```json
[
  { "name": "Ana Perez", "dob": "1990-01-15" },
  { "name": "Luis Gomez", "dob": "1985-06-20" }
]
```

`doc.md`:

```text
---
plugins:
  - template
data: patients.json
---

{{#each this}}

# {{name}}

Date of birth: {{dob}}

::pagebreak

{{/each}}
```

Exports as two pages, one per record, each with its own name and date filled in.

## Data sources

`data` is either the data itself, inline in front matter, or a path (relative to the document) to a `.json`, `.yaml`, or `.yml` file:

```yaml
---
plugins:
  - template
data:
  name: Ana Perez
  dob: 1990-01-15
---
```

A single object (as above) is for filling fields directly in a one-off document. An array is what `{{#each}}` iterates over, for the repeated-page case.

## Syntax

Standard [Handlebars](https://handlebarsjs.com): `{{field}}` interpolates, `{{#each list}}...{{/each}}` repeats its content once per item with that item as context, `{{#if field}}...{{/if}}` for conditional content. A missing field renders as empty rather than failing the export.

## Notes

- Your `.md` source is never rewritten, only the export/preview output.
- Values insert as raw text, not html-escaped.
- A missing or unreadable data file fails the export with a clear error.
- Runs before markdown parsing, so repeated content behaves like it was typed by hand.
