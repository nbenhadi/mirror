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

- [x] Add `apps/bot` (Discord, local dev)
- [ ] Host `apps/bot` (Raspberry Pi / old PC with PM2)
- [ ] Add `deploy-staging.yml` and `deploy-prod.yml` workflows once hosted
- [ ] Add `apps/web`
