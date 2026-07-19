# Contributing

## Branch strategy

```
main        production, receives merges from staging only
staging     pre-production, receives merges from develop only
develop     integration, receives PRs from feature branches
feat/*      new feature
fix/*       non-urgent bug fix
hotfix/*    urgent production fix (branches from main)
chore/*     maintenance, deps, config
docs/*      documentation only
```

Rules:

- Never push directly to `main`, `staging`, or `develop`.
- `feat/` and `fix/` branches target `develop` via PR.
- `develop` merges into `staging` via PR.
- `staging` merges into `main` via PR.
- `hotfix/` branches target `main` directly, then backport to `develop`.
- Always use "Create a merge commit" for integration branch PRs (`develop` to `staging`, `staging` to `main`). Squash only for feature branches.

After every merge into `main`, the `sync.yml` workflow automatically propagates the changes back to `staging` and `develop`.

## Commit messages

Follow [Conventional Commits](https://www.conventionalcommits.org/):

```
<type>[optional scope]: <short description>

Types: feat, fix, chore, docs, refactor, test, ci
```

Examples:

```
feat: add passphrase entropy display
fix: prevent requireEach from overwriting reserved positions
chore: update dependencies
docs: add CLI reference
```

## Pull requests

1. Branch from `develop` (or `main` for hotfixes).
2. Write or update tests for your change.
3. Run `pnpm lint && pnpm lint:types && pnpm test` locally.
4. Open a PR targeting `develop`.
5. CI must pass before merging.

## Releasing

Releases are managed by [Changesets](https://github.com/changesets/changesets).

1. Run `pnpm changeset` and follow the prompts to describe your change.
2. Commit the generated `.changeset/*.md` file.
3. Merge through `develop` to `staging` to `main`.
4. On merge to `main`, the release workflow either creates a "Version Packages" PR or publishes directly.

See [docs/deployment.md](docs/deployment.md) for the full release flow.

## Local setup

See [docs/development.md](docs/development.md).
