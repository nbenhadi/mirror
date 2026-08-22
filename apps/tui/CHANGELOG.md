# @nbenhadi/mirror-tui

## 1.7.0

### Minor Changes

- 388b73c: Add a shortcut to clear a field you're editing
- 388b73c: Add a table of contents plugin for md exports, with themeable style and optional page numbers
- 388b73c: Add a glossary plugin for md exports, with automatic page numbers and unused-term cleanup
- 388b73c: Add a template plugin for md exports, filling documents from json or yaml data and repeating pages per record

### Patch Changes

- 388b73c: Show a clear error instead of crashing when pdf or png export can't run
- 388b73c: Fix the md preview link disappearing before you can copy it
- 388b73c: Fix wrong paths when using path autocomplete on Windows
- 388b73c: Increase heading size in the default md theme
- 388b73c: Fix the browser and text editor not opening after md preview or edit on Windows
- 388b73c: Fix export crashing when saving directly to a drive letter on Windows

## 1.6.0

### Minor Changes

- 9fde7da: Add slide deck export (`md slides`) with PDF and HTML output, and a separate theme system for slides

### Patch Changes

- 37e8670: Fix md export crashing with a raw error when a plugin file does not export a valid plugin

## 1.5.2

### Patch Changes

- 40d69c5: Fix md tool crashing when used from the published TUI binary

## 1.5.1

### Patch Changes

- 49b919d: Fix TUI build to remove incompatible mirror-md dependency

## 1.5.0

### Minor Changes

- 023df41: Integrate markdown tool with export, preview, and theme editing in TUI

## 1.4.1

### Patch Changes

- bd6431d: Prevent requireEach from overwriting reserved character positions

## 1.4.0

### Minor Changes

- 7f94264: Initial clean release

## 1.3.0

### Minor Changes

- cf452a9: Initial clean release
