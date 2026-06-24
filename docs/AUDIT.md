# Mirror — Audit de código

**Fecha:** 2026-06-24  
**Estado:** Pendiente de corrección

---

## HIGH (3)

### H1 — Bug: error map keys incorrectos

**Archivo:** `apps/cli/src/commands/vault.ts:10-17`

El map de `failWithCode` usa claves `VALIDATION`, `EXECUTION`, `CRYPTO`, `DATABASE` pero los valores reales de `ToolErrorCode` son `VALIDATION_ERROR`, `EXECUTION_ERROR`, `CRYPTO_ERROR`, `DATABASE_ERROR`. Cuatro de siete errores devuelven `undefined` en la lookup → el usuario ve el mensaje raw en inglés del tool en vez del mensaje traducido.

**Fix:** cambiar las cuatro claves del map para incluir el sufijo `_ERROR`.

---

### H2 — Spec Rule 1: lógica de negocio en TUI

**Archivo:** `apps/tui/src/screens/settings-screen.tsx:62-72`

`computeResetChanges()` reimplementa el diff que ya vive en `packages/tools/settings/src/diff.ts`. La TUI importa `EDITABLE_FIELDS`, itera los campos, lee `field.default` y calcula el preview localmente. Desde que `reset({ action: 'reset', apply: false })` devuelve `r.data.diff.changes`, esta función es redundante y viola la regla de que las apps no contienen lógica de negocio.

**Fix:** usar `reset({ action: 'reset', key, apply: false })` para el preview y leer `r.data.diff.changes` directamente. Eliminar `computeResetChanges`.

---

### H3 — Config: campo `salt` requerido rompe vaults existentes

**Archivo:** `packages/config/src/schema.ts:28`

`vaultConfigSchema` define `salt: z.string()` como requerido. Cualquier vault creado antes de la feature de salt-en-config tiene `{ tools: { vault: { path: "..." } } }` sin `salt`. Cuando `readConfig()` valida con este schema, el bloque `tools.vault` falla → `loadConfig()` en el vault tool devuelve `{}` → todas las acciones de vault fallan con `NOT_FOUND` ("No vault initialized") aunque el archivo exista.

**Fix:** hacer `salt` opcional en `vaultConfigSchema` (`z.string().optional()`).

---

## MEDIUM (5)

### M1 — Spec Rule 4: `throw` escapa del boundary del tool

**Archivo:** `packages/tools/vault/src/actions/init.ts:52`

El `catch` maneja `EEXIST` pero rethrows todo lo demás (EACCES, ENOSPC, ENOENT en directorio padre). El engine lo captura, pero: (a) lo loggea como "Unhandled tool execution error" incorrectamente, y (b) el mensaje de error expone paths del sistema de ficheros del usuario.

**Fix:** capturar todos los errores y devolver `{ success: false, error: { code: 'EXECUTION_ERROR', message: '...' } }` sin rethrow.

---

### M2 — Bug: settings CLI siempre muestra `error.validation`

**Archivo:** `apps/cli/src/commands/settings.ts:42-134`

Todos los `if (!result.success)` llaman `ui.fatal(t('error.validation'))` sin mirar `result.error.code`. Un error `FORBIDDEN`, `NOT_FOUND` o `EXECUTION_ERROR` muestra "error de validación" al usuario.

**Fix:** mapear `result.error.code` al key de i18n correcto, igual que en `vault.ts` (una vez corregido H1).

---

### M3 — Duplicación: `capitalize` idéntico en ambas apps

**Archivos:** `apps/cli/src/utils/capitalize.ts`, `apps/tui/src/utils/capitalize.ts`

Las dos funciones son byte-a-byte idénticas. Cada app mantiene su propia copia.

**Fix:** mover a `@nbenhadi/mirror-brand` (o `@nbenhadi/mirror-i18n`) e importar desde ahí en ambas apps.

---

### M4 — Duplicación: `setByPath` duplicado

**Archivos:** `packages/tools/settings/src/actions/get.ts:10-18`, `packages/tools/settings/src/actions/list.ts:7-15`

Función privada idéntica en ambos archivos. `path-util.ts` ya existe y exporta utilidades de path.

**Fix:** exportar `setByPath` desde `path-util.ts` e importar en ambos archivos.

---

### M5 — Duplicación: validación `general.lang` redundante

**Archivo:** `packages/tools/settings/src/actions/set.ts:10-52`

`validateValueForKey` repite exactamente la misma validación de locale que `field.validate`. `set.ts` llama a `field.validate(input.value)` y después a `validateValueForKey(input.key, input.value)`. La segunda llamada es siempre redundante.

**Fix:** eliminar `validateValueForKey` y su llamada.

---

## LOW (5)

### L1 — Dead code: rama `key === undefined` inalcanzable

**Archivo:** `packages/tools/settings/src/actions/get.ts:22-33`

`getSchema` define `key: z.enum(keys)` como requerido. Cualquier llamada sin `key` falla la validación del schema antes de llegar al handler. El branch `if (input.key === undefined)` nunca se ejecuta.

**Fix:** eliminar la rama muerta, o hacer `key` opcional en `getSchema` si el caso "get all" se quiere soportar explícitamente.

---

### L2 — Dead file: `cli-config.ts` nunca importado

**Archivo:** `apps/cli/src/utils/cli-config.ts`

Exporta `readCliConfig` y `writeCliConfig`. Cero importadores tras la migración a `readConfigSync()`.

**Fix:** eliminar el archivo.

---

### L3 — Security: `stdin!` puede lanzar excepción no capturada

**Archivo:** `apps/cli/src/utils/clipboard.ts:66-68`

`child.stdin!.write(text)` — si `spawn()` devuelve un proceso con `stdin === null` (edge case bajo recursos agotados o plataformas no estándar), el operador `!` desreferencia null y lanza síncronamente fuera del try-catch. El clipboard falla sin fallback graceful.

**Fix:** guardar con `if (child.stdin)` o envolver en try-catch.

---

### L4 — Non-null assertions

**Archivos:** `packages/tools/vault/src/actions/edit.ts:29`, `packages/tools/vault/src/actions/purge.ts:29`

`input.newTitle!.toLowerCase()` y `input.title!.toLowerCase()` usan el operador `!` que el proyecto prohíbe explícitamente (SPECIFICATION.md §13.1). Sin riesgo real en runtime por las guards del entorno, pero viola la convención.

**Fix:** usar cast explícito `(input.newTitle as string)` o reestructurar para estrechar el tipo sin `!`.

---

### L5 — Type drift: dos `VaultConfig` con shapes distintas

**Archivos:** `packages/tools/vault/src/types.ts`, `packages/config/src/schema.ts`

Mismo nombre, mismo propósito, shapes diferentes: la del vault tiene `salt?: string` (opcional), la del config tiene `salt: string` (requerido). Confusión sobre cuál es canónico. El vault importa la suya propia en vez de reutilizar la del config.

**Fix:** el vault debería importar y extender el tipo del config package en vez de redeclararlo.

---

## Resumen

| #   | Sev  | Categoría                    | Archivo                                        |
| --- | ---- | ---------------------------- | ---------------------------------------------- |
| H1  | HIGH | Bug: error map keys          | `apps/cli/src/commands/vault.ts:10`            |
| H2  | HIGH | Spec: lógica en TUI          | `apps/tui/src/screens/settings-screen.tsx:62`  |
| H3  | HIGH | Config: salt requerido       | `packages/config/src/schema.ts:28`             |
| M1  | MED  | Spec: throw en tool          | `packages/tools/vault/src/actions/init.ts:52`  |
| M2  | MED  | Bug: error code ignorado     | `apps/cli/src/commands/settings.ts`            |
| M3  | MED  | Dup: capitalize              | `apps/cli+tui/src/utils/capitalize.ts`         |
| M4  | MED  | Dup: setByPath               | `settings/src/actions/get.ts:10` + `list.ts:7` |
| M5  | MED  | Dup: validate lang doble     | `settings/src/actions/set.ts:10`               |
| L1  | LOW  | Dead code: rama inalcanzable | `settings/src/actions/get.ts:22`               |
| L2  | LOW  | Dead file                    | `apps/cli/src/utils/cli-config.ts`             |
| L3  | LOW  | Security: stdin! uncaught    | `apps/cli/src/utils/clipboard.ts:66`           |
| L4  | LOW  | Non-null assertions          | `vault/actions/edit.ts:29`, `purge.ts:29`      |
| L5  | LOW  | Type drift: VaultConfig      | `vault/types.ts` vs `config/schema.ts`         |
