# Development

## Prerequisites

- Node.js 22+
- pnpm 11+

## Setup

```bash
git clone https://github.com/nbenhadi/mirror.git
cd mirror
pnpm install
```

## Environment variables

Copy `.env.example` to `.env` and adjust as needed:

```bash
cp .env.example .env
```

| Variable    | Default       | Description                                                                   |
| ----------- | ------------- | ----------------------------------------------------------------------------- |
| `NODE_ENV`  | `development` | Runtime environment (`development`, `test`, `staging`, `production`)          |
| `LOG_LEVEL` | `info`        | Pino log level (`trace`, `debug`, `info`, `warn`, `error`, `fatal`, `silent`) |

## Scripts

Run from the repo root. All scripts use Turborepo and run across all packages in dependency order.

| Script               | Description                               |
| -------------------- | ----------------------------------------- |
| `pnpm build`         | Compile all packages and apps             |
| `pnpm dev`           | Watch mode for all packages               |
| `pnpm test`          | Run all tests                             |
| `pnpm test:coverage` | Run tests with coverage report            |
| `pnpm lint`          | ESLint across all packages                |
| `pnpm lint:types`    | TypeScript type check across all packages |
| `pnpm clean`         | Delete all build artifacts                |
| `pnpm changeset`     | Create a new changeset for a release      |

## Running the apps locally

```bash
# CLI
pnpm --filter ./apps/cli dev -- password generate

# TUI
pnpm --filter ./apps/tui dev
```

## Project structure

See [architecture.md](architecture.md).

## Testing

Each package has its own test suite using Vitest. Tests live alongside source files as `*.test.ts`.

```bash
# Run tests for a single package
pnpm --filter @nbenhadi/mirror-password test
```

Coverage reports are generated in `<package>/coverage/` when running `pnpm test:coverage`.

## Pre-commit and pre-push hooks

Husky runs automatically:

- Pre-commit: lint-staged (ESLint + Prettier on staged files).
- Pre-push: build + test.
