# Claude Instructions

@docs/architecture.md

## Communication style

No em dashes (---, -). Use short sentences, periods, commas.
Responses in Spanish.

## Language

All code in English: variables, functions, types, constants, file names, comments.

## Formatting

No alignment padding. `const x = 0` not `const x       = 0`.
No non-ASCII characters in code: no accents, no emojis, no special symbols.
Respect existing ESLint and Prettier config. Never disable rules without cause.

## Comments

Write no comments by default.
Only comment when the WHY is non-obvious: a hidden constraint, a workaround, a subtle invariant.
Never explain what the code does. Well-named identifiers do that.
Never reference the task, the fix, or the caller ("added for X flow", "fixes issue #123").
One line max. No block comments, no multi-line docstrings.

## Code quality

No duplicated logic. Extract before copy-pasting.
Use existing classes and utilities before writing new ones.
No dead code, no unused variables, no commented-out blocks.
Keep functions small and single-purpose.
No `any`. Use `unknown` and narrow the type.
No non-null assertions (`!`). Handle `undefined` explicitly.

## Architecture (this project)

Apps contain no business logic. They parse input, call core, display result.
All business logic lives in `packages/`.
Tools never know their consumers. They receive input and context, return `ToolResult`.
No circular dependencies: `apps` -> `packages`, never the reverse.
Errors return as `ToolResult`, never as unhandled throws.

## Markdown

Blank line after every heading.
Blank line between paragraphs and list blocks.
No trailing spaces.
No non-ASCII characters.
Lists use `-` not `*`.
Code blocks always specify the language.
One blank line before and after a code block.
No inline HTML unless strictly necessary.

## Git

Branch names: `feat/`, `fix/`, `hotfix/`, `chore/`, `docs/`.
Commit messages: Conventional Commits format. Short, in English.
No direct push to `main`, `staging`, or `develop`.
Never run git add, commit, push, merge, switch, checkout, or rebase. The user does all git operations. Only provide commit messages when asked.

## Project structure

One responsibility per file.
`packages/` for all logic. `apps/` for interfaces only.
New tool = new package under `packages/tools/`.
No logic shared between apps directly. Go through `packages/`.
File names in kebab-case.
Exported types in PascalCase. Variables and functions in camelCase. Constants in SCREAMING_SNAKE_CASE.
No barrel files (`index.ts` that re-exports everything) unless the package boundary requires it.

## TypeScript

`strict: true` always. Never bypass with `@ts-ignore` or `@ts-expect-error` without a comment explaining why.
No enums. Use `z.enum()` or string unions.
Prefer `type` for utility types. Use `interface` for contracts.
No `as` casts unless narrowing from `unknown`.
`exactOptionalPropertyTypes` is on. Do not assign `undefined` to optional properties explicitly.
