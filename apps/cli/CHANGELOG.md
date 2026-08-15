# @nbenhadi/mirror-cli

## 1.8.0

### Minor Changes

- 388b73c: Add a table of contents plugin for md exports, with themeable style and optional page numbers
- 388b73c: Add a glossary plugin for md exports, with automatic page numbers and unused-term cleanup
- 388b73c: Add a template plugin for md exports, filling documents from json or yaml data and repeating pages per record

### Patch Changes

- 388b73c: Show a clear error instead of crashing when pdf or png export can't run
- 388b73c: Increase heading size in the default md theme
- 388b73c: Fix the browser and text editor not opening after md preview or edit on Windows
- 388b73c: Fix export crashing when saving directly to a drive letter on Windows

## 1.7.0

### Minor Changes

- 9fde7da: Add slide deck export (`md slides`) with PDF and HTML output, and a separate theme system for slides

### Patch Changes

- 37e8670: Fix md export crashing with a raw error when a plugin file does not export a valid plugin

## 1.6.1

### Patch Changes

- 8ad9a79: Fix CLI crashing on install with "Cannot find module" errors
- 8ad9a79: Fix md export failing with an unreadable error when the page range does not exist in the document
- 8ad9a79: Fix md commands showing untranslated error messages on failure

## 1.6.0

### Minor Changes

- b4c5c5d: Add markdown tool command with export, import, preview, edit, and theme management

## 1.5.1

### Patch Changes

- bd6431d: Prevent requireEach from overwriting reserved character positions

## 1.5.0

### Minor Changes

- 7f94264: Initial clean release

## 1.4.0

### Minor Changes

- cf452a9: Initial clean release
