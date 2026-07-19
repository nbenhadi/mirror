# Roadmap

## Pending

### Tests

- [ ] Add E2E tests for CLI commands using `execa`
- [ ] Increase coverage on undertested files (see below) before enforcing threshold
- [ ] Set coverage threshold to 80% in all vitest configs once coverage improves

Key files currently at 0% coverage that need tests:

| Package  | File            | Why 0%                                     |
| -------- | --------------- | ------------------------------------------ |
| `core`   | `engine.ts`     | Tested indirectly; needs direct unit tests |
| `vault`  | `crypto.ts`     | Crypto functions untested                  |
| `vault`  | `session.ts`    | Session management untested                |
| `vault`  | `vault-file.ts` | File I/O untested                          |
| `vault`  | `init.ts`       | Init action untested                       |
| `config` | `paths.ts`      | Path resolution partially untested         |

---

## Future

- [ ] Add `apps/bot`
- [ ] Add `apps/web`
- [ ] Add `deploy-staging.yml` and `deploy-prod.yml` workflows
- [ ] Add `staging` and `production` env secrets to GitHub Actions
