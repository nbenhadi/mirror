# Deployment

## Environments

| Environment   | Branch    | Purpose                              |
| ------------- | --------- | ------------------------------------ |
| `development` | `develop` | Local development and CI integration |
| `staging`     | `staging` | Pre-production validation            |
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

3. Merge through the branch chain: `develop` to `staging` to `main`.

4. On merge to `main`, the `release.yml` workflow runs:
   - If pending changesets exist: creates a "Version Packages" PR that bumps versions and updates `CHANGELOG.md`.
   - If the "Version Packages" PR is merged: publishes both apps to GitHub Packages and creates GitHub Releases.

### Sync

After every merge to `main`, the `sync.yml` workflow automatically merges `main` into `staging` and `staging` into `develop`. No manual sync needed.

## Published packages

Apps under `apps/` that have a `publishConfig` pointing to GitHub Packages are published. All `packages/*` are `private: true` and bundled into the app binaries at build time.

Registry: `https://npm.pkg.github.com`

## CI workflows

| Workflow      | Trigger                                    | Purpose                                                 |
| ------------- | ------------------------------------------ | ------------------------------------------------------- |
| `ci.yml`      | Push or PR to `main`, `staging`, `develop` | Lint, type check, build, test, audit, branch name check |
| `release.yml` | Push to `main`                             | Create version PR or publish                            |
| `sync.yml`    | Push to `main`                             | Sync `main` into `staging` and `develop`                |

## Hotfixes

For urgent production fixes:

1. Branch from `main`: `hotfix/description`.
2. Apply the fix.
3. PR to `main` directly.
4. Create a `patch` changeset.
5. After merge and publish, backport to `develop`: `git merge origin/main`.
