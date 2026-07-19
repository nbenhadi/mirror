# Password tool

Package: `@nbenhadi/mirror-password`

Provides three actions: `generate`, `check`, and `passphrase`.

## generate

Generates a random password from a configurable charset.

### Input

| Field              | Type                              | Default | Description                                            |
| ------------------ | --------------------------------- | ------- | ------------------------------------------------------ |
| `length`           | `number`                          | `16`    | Password length (8-128)                                |
| `uppercase`        | `boolean`                         | `true`  | Include uppercase letters                              |
| `numbers`          | `boolean`                         | `true`  | Include digits                                         |
| `symbols`          | `boolean`                         | `false` | Include symbols (`!@#$%^&*...`)                        |
| `excludeAmbiguous` | `boolean`                         | `false` | Exclude `0`, `O`, `1`, `l`, `I`, `\|`                  |
| `requireEach`      | `boolean`                         | `false` | Guarantee at least one character from each active type |
| `noRepeat`         | `boolean`                         | `false` | No character repeated in the output                    |
| `exclude`          | `string`                          | -       | Characters to remove from the charset                  |
| `include`          | `string`                          | -       | Characters to add to the charset                       |
| `separator`        | `{ char: string, every: number }` | -       | Insert separator every N characters                    |
| `prefix`           | `string`                          | -       | Fixed prefix                                           |
| `suffix`           | `string`                          | -       | Fixed suffix                                           |

### Notes

- `requireEach` guarantees representation but does not affect randomness otherwise.
- `noRepeat` requires `length <= charset.size`. Returns an error if not satisfied.
- `exclude` and `include` are applied after the base charset is built.

## check

Evaluates password strength using zxcvbn.

### Input

| Field      | Type     | Description          |
| ---------- | -------- | -------------------- |
| `password` | `string` | Password to evaluate |

### Output

| Field           | Type       | Description                                     |
| --------------- | ---------- | ----------------------------------------------- |
| `score`         | `0-4`      | Strength score (0 = very weak, 4 = very strong) |
| `label`         | `string`   | Strength label key                              |
| `effectiveBits` | `number`   | Estimated entropy in bits                       |
| `crackTime`     | `string`   | Human-readable offline crack time estimate      |
| `warnings`      | `string[]` | Warning keys for common patterns                |

## passphrase

Generates a random passphrase from an embedded word list (EFF large wordlist, 7776 words).

### Input

| Field        | Type      | Default | Description                          |
| ------------ | --------- | ------- | ------------------------------------ |
| `words`      | `number`  | `6`     | Number of words (3-20)               |
| `separator`  | `string`  | `-`     | Word separator                       |
| `capitalize` | `boolean` | `false` | Capitalize first letter of each word |
| `number`     | `boolean` | `false` | Append a random digit                |

### Entropy

A 6-word passphrase from a 7776-word list has approximately 77.5 bits of entropy.
