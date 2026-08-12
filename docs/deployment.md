# Deployment

## Environments

| Environment   | Branch    | Purpose                              |
| ------------- | --------- | ------------------------------------ |
| `development` | `develop` | Local development and CI integration |
| `production`  | `main`    | Published releases                   |

## Release flow

Releases are automated via [Changesets](https://github.com/changesets/changesets) and GitHub Actions.

### Step by step

1. Create a changeset while working on your branch:

```bash
pnpm changeset
```

Select the affected apps (`@nbenhadi/mirror-cli`, `@nbenhadi/mirror-tui`), choose the bump type (`patch`, `minor`, `major`), and write a short summary of the change.

2. Commit the generated `.changeset/*.md` file.

3. Merge to `main`.

4. On merge to `main`, the `release.yml` workflow runs:
   - If pending changesets exist: creates a "Version Packages" PR that bumps versions and updates `CHANGELOG.md`.
   - If the "Version Packages" PR is merged: publishes both apps to GitHub Packages and creates GitHub Releases.

### Writing changesets

The changeset summary becomes a line in `CHANGELOG.md` and in the GitHub Release notes. Users read it with zero context from the PR or the conversation that produced it.

- One changeset, one change. If a fix touches two unrelated things, write two changesets.
- Describe the symptom or the benefit, never the implementation. No library names, file names, function names, or words like "bundler", "external", "try/catch".
- Imperative, present tense, like a commit subject: `Fix X`, `Add Y`. No `Fixed X was...`, no paragraphs.
- One short sentence.
- Correct bump: `patch` for a bug fix that does not change the API, `minor` for a backward-compatible feature, `major` for a breaking change.
- No PR or issue numbers in the text. Git already tracks that.
- Must stand alone. Someone reading only `CHANGELOG.md` must understand it.

Bad: `Fix TUI build crashing on gray-matter and mammoth dynamic requires by keeping them external`

Good: `Fix md tool crashing when used from the published TUI binary`

### Sync

After every merge to `main`, the `sync.yml` workflow automatically merges `main` into `develop`. No manual sync needed.

## Published packages

Apps under `apps/` that have a `publishConfig` pointing to GitHub Packages are published. All `packages/*` are `private: true` and bundled into the app binaries at build time.

Registry: `https://npm.pkg.github.com`

## CI workflows

| Workflow      | Trigger                         | Purpose                                                 |
| ------------- | ------------------------------- | ------------------------------------------------------- |
| `ci.yml`      | Push or PR to `main`, `develop` | Lint, type check, build, test, audit, branch name check |
| `release.yml` | Push to `main`                  | Create version PR or publish                            |
| `sync.yml`    | Push to `main`                  | Sync `main` into `develop`                              |

## Hotfixes

For urgent production fixes:

1. Branch from `main`: `hotfix/description`.
2. Apply the fix.
3. PR to `main` directly.
4. Create a `patch` changeset.
5. After merge and publish, `sync.yml` automatically syncs changes to `develop`.
