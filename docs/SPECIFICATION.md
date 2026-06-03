# Mirror — Especificaciones Técnicas

**Versión:** 1.0  
**Fecha:** Junio 2026  
**Estado:** Documento de referencia — punto de partida del proyecto

---

## Tabla de contenidos

1. [Visión y contexto](#1-visión-y-contexto)
2. [Filosofía de arquitectura](#2-filosofía-de-arquitectura)
3. [Stack tecnológico](#3-stack-tecnológico)
4. [Estructura del monorepo](#4-estructura-del-monorepo)
5. [El contrato del sistema](#5-el-contrato-del-sistema)
6. [Packages core](#6-packages-core)
7. [Packages tools](#7-packages-tools)
8. [Aplicaciones](#8-aplicaciones)
9. [Seguridad y criptografía](#9-seguridad-y-criptografía)
10. [Base de datos](#10-base-de-datos)
11. [Tests](#11-tests)
12. [Infraestructura](#12-infraestructura)
13. [Convenciones de código](#13-convenciones-de-código)
14. [Roadmap](#14-roadmap)
15. [Glosario](#15-glosario)

---

## 1. Visión y contexto

### 1.1 Qué es Mirror

Mirror es una **plataforma modular multiplataforma de herramientas y automatización**. Su principio fundamental es que una capacidad existe una sola vez y puede ser utilizada desde cualquier entorno.

Mirror no es una aplicación monolítica. Es un **ecosistema de capacidades reutilizables** expuesto desde múltiples interfaces.

### 1.2 Principio fundamental

```
Las apps son interfaces.
Toda la lógica real vive en packages/.
```

Las aplicaciones:

- reciben el input
- llaman al core
- muestran el resultado

No contienen **ninguna lógica de negocio**.

### 1.3 Interfaces previstas

| Interfaz           | Descripción          | Ejemplo de uso                             |
| ------------------ | -------------------- | ------------------------------------------ |
| `apps/cli`         | Terminal clásica     | `mirror password generate --length 20`     |
| `apps/api`         | Backend REST         | `POST /tools/password-generator`           |
| `apps/tui`         | Terminal interactiva | Navegación con teclado en las herramientas |
| `apps/web`         | Dashboard web        | Gestión visual de herramientas             |
| `apps/discord-bot` | Bot Discord          | `/password generate length:20`             |

### 1.4 Herramientas iniciales

El proyecto comienza con dos herramientas concretas:

- **password-generator** — genera una contraseña aleatoria según parámetros (longitud, caracteres especiales, dígitos, mayúsculas). Herramienta pura: sin base de datos, sin contexto de usuario.
- **password-manager** — almacena, recupera y elimina contraseñas cifradas asociadas a una cuenta de usuario. Requiere autenticación, base de datos y criptografía.

Estas dos herramientas cubren intencionalmente los dos casos fundamentales del sistema: una herramienta sin estado y una herramienta con estado persistido.

---

## 2. Filosofía de arquitectura

### 2.1 Reglas innegociables

**Regla 1 — Las apps no contienen lógica de negocio.**  
Una app parsea el input, llama a `core.execute()`, y muestra el resultado. Eso es todo.

**Regla 2 — Las herramientas no conocen sus consumidores.**  
Una herramienta no sabe si es llamada desde un CLI, una API o un bot Discord. Recibe un `input` y un `ToolContext`. Retorna un `ToolResult`. Fin.

**Regla 3 — Sin dependencias circulares.**  
`apps` → `packages`, nunca al revés. Una herramienta no puede importar una app.

**Regla 4 — Errores tipificados, nunca `throw` no capturado.**  
El engine intercepta todos los errores. Toda salida es un `ToolResult`.

**Regla 5 — No construir lo que no es necesario todavía.**  
Redis, BullMQ, i18n, OAuth, Kubernetes: se añaden cuando hay una razón real. No antes.

### 2.2 Flujo de ejecución

```
usuario
  → app           (parsea input, llama core)
  → core.execute  (busca tool, valida schema, construye ctx)
  → tool.execute  (lógica de negocio)
  → ToolResult    (success/failure tipificado)
  → app           (muestra resultado)
```

La misma llamada `core.execute("password-generator", { length: 20 })` funciona idénticamente desde CLI, API REST, bot Discord o TUI. Cero duplicación de código.

### 2.3 Lo que no haremos

- Sin lógica de negocio en las apps
- Sin acoplamiento entre herramientas
- Sin `packages/utils` como cajón de sastre
- Sin `packages/sdk` antes de tener múltiples apps que lo necesiten
- Sin monolitos disfrazados de packages

---

## 3. Stack tecnológico

### 3.1 Stack oficial

| Capa          | Tecnología                         | Justificación                                                      |
| ------------- | ---------------------------------- | ------------------------------------------------------------------ |
| Lenguaje      | TypeScript estricto                | Tipificación compartida frontend/backend, seguridad en compilación |
| Monorepo      | pnpm + Turborepo                   | Workspace nativo, caché de build inteligente                       |
| API           | Fastify                            | Ligero, rápido, excelente soporte TypeScript                       |
| CLI           | Commander.js                       | Maduro, bien documentado, ecosistema estable                       |
| TUI           | Ink                                | Componentes React en terminal                                      |
| Discord       | discord.js                         | Estándar de facto                                                  |
| Base de datos | PostgreSQL + Drizzle ORM           | Relacional robusto, ORM type-safe                                  |
| Validación    | Zod                                | Validación + inferencia de tipos en una sola herramienta           |
| Criptografía  | node:crypto (AES-256-GCM) + Argon2 | Estándar industrial para contraseñas                               |
| Logs          | Pino                               | Más performante en Node.js                                         |
| Tests         | Vitest                             | Compatible ESM, rápido, API compatible Jest                        |

### 3.2 Tecnologías diferidas

Estas tecnologías están previstas pero **no se implementarán antes de tener una necesidad real**:

| Tecnología             | Razón del diferimiento                        | Disparador para añadir                  |
| ---------------------- | --------------------------------------------- | --------------------------------------- |
| Redis + BullMQ         | Sin jobs asincronos en fases 1-3              | Primer caso de uso de job en background |
| Playwright             | Sin UI web antes de fase 4                    | Inicio de `apps/web`                    |
| OAuth (Google, GitHub) | Complejidad innecesaria sin usuarios externos | Solicitud explícita de auth social      |
| Kubernetes             | Escalabilidad prematura                       | Primera necesidad de multi-instancias   |
| i18n                   | Sin multi-idioma previsto                     | Decisión explícita del producto         |

### 3.3 Node.js

Versión mínima requerida: **Node.js 20 LTS** (soporte ESM nativo, `node:crypto` estable).

---

## 4. Estructura del monorepo

### 4.1 Vista general

```
mirror/
├── apps/
│   ├── api/                    → Backend REST (Fastify)
│   ├── cli/                    → CLI (Commander.js)
│   ├── tui/                    → TUI interactivo (Ink) — fase 2
│   ├── discord-bot/            → Bot Discord — fase 4
│   └── workers/                → Jobs en background (BullMQ) — fase 5
│
├── packages/
│   ├── core/                   → Engine, registry, ejecución
│   ├── tools/
│   │   ├── password-generator/ → Herramienta 1: generación
│   │   └── password-manager/   → Herramienta 2: gestión con DB
│   ├── database/               → Drizzle ORM, schema, repositorios
│   ├── auth/                   → JWT, sesiones
│   ├── crypto/                 → Cifrado/descifrado
│   ├── errors/                 → Errores tipificados compartidos
│   ├── logger/                 → Instancia Pino compartida
│   └── config/                 → Validación env con Zod
│
├── infrastructure/
│   └── docker/                 → compose.yml para dev local
│
├── docs/                       → Documentación técnica
├── tests/                      → Tests de integración globales
│
├── pnpm-workspace.yaml
├── turbo.json
├── tsconfig.base.json
└── package.json
```

### 4.2 Configuración del monorepo

**`pnpm-workspace.yaml`**

```yaml
packages:
  - 'apps/*'
  - 'packages/*'
```

**`turbo.json`**

```json
{
  "$schema": "https://turbo.build/schema.json",
  "tasks": {
    "build": {
      "dependsOn": ["^build"],
      "outputs": ["dist/**"]
    },
    "dev": {
      "cache": false,
      "persistent": true
    },
    "test": {
      "dependsOn": ["^build"]
    },
    "lint": {}
  }
}
```

**`tsconfig.base.json`**

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "NodeNext",
    "moduleResolution": "NodeNext",
    "strict": true,
    "exactOptionalPropertyTypes": true,
    "noUncheckedIndexedAccess": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "declaration": true,
    "declarationMap": true,
    "sourceMap": true
  }
}
```

### 4.3 Nombrado de packages

Todos los packages usan el scope `@mirror/`:

| Carpeta                             | Nombre del package                 |
| ----------------------------------- | ---------------------------------- |
| `packages/core`                     | `@mirror/core`                     |
| `packages/tools/password-generator` | `@mirror/tools-password-generator` |
| `packages/tools/password-manager`   | `@mirror/tools-password-manager`   |
| `packages/database`                 | `@mirror/database`                 |
| `packages/auth`                     | `@mirror/auth`                     |
| `packages/crypto`                   | `@mirror/crypto`                   |
| `packages/errors`                   | `@mirror/errors`                   |
| `packages/logger`                   | `@mirror/logger`                   |
| `packages/config`                   | `@mirror/config`                   |

---

## 5. El contrato del sistema

El contrato es la parte más importante de este documento. Todo lo demás se deriva de esto.

### 5.1 ToolContext

El contexto inyectado en cada herramienta en la ejecución.

```typescript
// packages/core/src/types.ts

import type { Logger } from 'pino'
import type { DatabaseClient } from '@mirror/database'

export interface ToolContext {
  /** ID único de la solicitud — para trazabilidad de logs */
  requestId: string

  /** ID del usuario autenticado — ausente si no hay sesión */
  userId?: string

  /** Instancia Pino para logs — nunca console.log en una tool */
  logger: Logger

  /** Cliente base de datos — ausente si la tool no lo necesita */
  db?: DatabaseClient

  /** Permisos otorgados a este usuario */
  permissions: string[]
}
```

### 5.2 Tool

El contrato que toda herramienta debe respetar.

```typescript
import type { ZodSchema } from 'zod'
import type { ToolContext, ToolResult } from './types'

export interface Tool<TInput = unknown, TOutput = unknown> {
  /** Identificador único — kebab-case, ej: "password-generator" */
  id: string

  /** Descripción corta legible por un humano */
  description: string

  /** Schema Zod que valida y tipifica el input */
  schema: ZodSchema<TInput>

  /** Función de ejecución — retorna siempre un ToolResult, nunca throw */
  execute: (input: TInput, ctx: ToolContext) => Promise<ToolResult<TOutput>>
}
```

### 5.3 ToolResult

Toda salida de una herramienta está encapsulada en este tipo unión. Nunca `throw` no capturado.

```typescript
export type ToolResult<T> = { success: true; data: T } | { success: false; error: ToolError }

export interface ToolError {
  code: ToolErrorCode
  message: string
  details?: unknown
}

export type ToolErrorCode =
  | 'VALIDATION_ERROR' // input inválido según schema Zod
  | 'NOT_FOUND' // recurso inexistente
  | 'UNAUTHORIZED' // sin sesión o token inválido
  | 'FORBIDDEN' // sesión válida pero permisos insuficientes
  | 'EXECUTION_ERROR' // error inesperado durante ejecución
  | 'CRYPTO_ERROR' // error de cifrado/descifrado
  | 'DATABASE_ERROR' // error de consulta base de datos
```

---

## 6. Packages core

### 6.1 `packages/core`

El núcleo del sistema. Todas las apps dependen de esto. No depende de ninguna app.

**Estructura interna:**

```
packages/core/
├── src/
│   ├── index.ts        → exports públicos solamente
│   ├── engine.ts       → execute(toolId, input, overrides?)
│   ├── registry.ts     → register(tool) / get(id) / list()
│   ├── context.ts      → buildContext(overrides)
│   └── types.ts        → Tool, ToolContext, ToolResult, ToolError
├── package.json
└── tsconfig.json
```

**`registry.ts`:**

```typescript
import type { Tool } from './types'

class ToolRegistry {
  private tools = new Map<string, Tool>()

  register(tool: Tool): void {
    if (this.tools.has(tool.id)) {
      throw new Error(`Tool "${tool.id}" already registered`)
    }
    this.tools.set(tool.id, tool)
  }

  get(id: string): Tool {
    const tool = this.tools.get(id)
    if (!tool) throw new Error(`Tool "${id}" not found in registry`)
    return tool
  }

  list(): Tool[] {
    return Array.from(this.tools.values())
  }

  has(id: string): boolean {
    return this.tools.has(id)
  }
}

export const registry = new ToolRegistry()
```

**`engine.ts`:**

```typescript
import { registry } from './registry'
import { buildContext } from './context'
import type { ToolContext, ToolResult } from './types'

interface ExecuteOptions {
  toolId: string
  input: unknown
  contextOverrides?: Partial<ToolContext>
}

export async function execute<T = unknown>(options: ExecuteOptions): Promise<ToolResult<T>> {
  const { toolId, input, contextOverrides } = options
  const ctx = buildContext(contextOverrides)

  let tool
  try {
    tool = registry.get(toolId)
  } catch {
    return {
      success: false,
      error: { code: 'NOT_FOUND', message: `Tool "${toolId}" not found` },
    }
  }

  const parsed = tool.schema.safeParse(input)
  if (!parsed.success) {
    return {
      success: false,
      error: {
        code: 'VALIDATION_ERROR',
        message: parsed.error.message,
        details: parsed.error.flatten(),
      },
    }
  }

  try {
    return (await tool.execute(parsed.data, ctx)) as ToolResult<T>
  } catch (err) {
    ctx.logger.error({ err, toolId }, 'Unhandled tool execution error')
    return {
      success: false,
      error: {
        code: 'EXECUTION_ERROR',
        message: err instanceof Error ? err.message : 'Unknown error',
      },
    }
  }
}
```

**`context.ts`:**

```typescript
import { randomUUID } from 'node:crypto'
import { createLogger } from '@mirror/logger'
import type { ToolContext } from './types'

export function buildContext(overrides?: Partial<ToolContext>): ToolContext {
  return {
    requestId: randomUUID(),
    permissions: [],
    logger: createLogger(),
    ...overrides,
  }
}
```

### 6.2 `packages/errors`

Errores tipificados reutilizables en todo el sistema.

```typescript
// packages/errors/src/index.ts

export class MirrorError extends Error {
  constructor(
    public readonly code: string,
    message: string,
    public readonly details?: unknown
  ) {
    super(message)
    this.name = 'MirrorError'
  }
}

export class ValidationError extends MirrorError {
  constructor(message: string, details?: unknown) {
    super('VALIDATION_ERROR', message, details)
    this.name = 'ValidationError'
  }
}

export class NotFoundError extends MirrorError {
  constructor(resource: string) {
    super('NOT_FOUND', `${resource} not found`)
    this.name = 'NotFoundError'
  }
}

export class UnauthorizedError extends MirrorError {
  constructor(message = 'Authentication required') {
    super('UNAUTHORIZED', message)
    this.name = 'UnauthorizedError'
  }
}

export class ForbiddenError extends MirrorError {
  constructor(message = 'Insufficient permissions') {
    super('FORBIDDEN', message)
    this.name = 'ForbiddenError'
  }
}
```

### 6.3 `packages/logger`

Instancia Pino compartida. Nunca `console.log` en una herramienta o package.

```typescript
// packages/logger/src/index.ts

import pino from 'pino'

export function createLogger(context?: Record<string, unknown>) {
  return pino({
    level: process.env['LOG_LEVEL'] ?? 'info',
    transport: process.env['NODE_ENV'] === 'development' ? { target: 'pino-pretty' } : undefined,
  }).child(context ?? {})
}

export type Logger = ReturnType<typeof createLogger>
```

### 6.4 `packages/config`

Validación de variables de entorno al arranque. Si falta una variable obligatoria, el proceso falla inmediatamente con un mensaje claro.

```typescript
// packages/config/src/index.ts

import { z } from 'zod'

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  DATABASE_URL: z.string().url(),
  JWT_SECRET: z.string().min(32),
  LOG_LEVEL: z.enum(['trace', 'debug', 'info', 'warn', 'error']).default('info'),
})

function loadConfig() {
  const result = envSchema.safeParse(process.env)
  if (!result.success) {
    console.error('Invalid environment configuration:')
    console.error(result.error.flatten().fieldErrors)
    process.exit(1)
  }
  return result.data
}

export const config = loadConfig()
export type Config = typeof config
```

---

## 7. Packages tools

### 7.1 Estructura de una herramienta

Cada herramienta es un package independiente. Estructura estándar:

```
packages/tools/<nombre-herramienta>/
├── src/
│   ├── index.ts        → exporta el objeto tool
│   ├── schema.ts       → validación Zod del input
│   ├── execute.ts      → lógica de negocio
│   └── types.ts        → tipos específicos de la herramienta
├── package.json
├── tsconfig.json
└── README.md           → descripción, input/output, ejemplos
```

### 7.2 `packages/tools/password-generator`

Herramienta sin estado. No requiere base de datos ni usuario autenticado.

**`schema.ts`:**

```typescript
import { z } from 'zod'

export const schema = z.object({
  length: z.number().int().min(8).max(128).default(16),
  uppercase: z.boolean().default(true),
  numbers: z.boolean().default(true),
  symbols: z.boolean().default(false),
})

export type PasswordGeneratorInput = z.infer<typeof schema>
```

**`execute.ts`:**

```typescript
import { randomInt } from 'node:crypto'
import type { PasswordGeneratorInput } from './schema'
import type { ToolContext, ToolResult } from '@mirror/core'

export async function execute(
  input: PasswordGeneratorInput,
  _ctx: ToolContext
): Promise<ToolResult<{ password: string }>> {
  const charset = buildCharset(input)
  if (charset.length === 0) {
    return {
      success: false,
      error: { code: 'VALIDATION_ERROR', message: 'No character set selected' },
    }
  }

  // Usa node:crypto para aleatoriedad criptográficamente segura
  const password = Array.from(
    { length: input.length },
    () => charset[randomInt(charset.length)]
  ).join('')

  return { success: true, data: { password } }
}

function buildCharset(input: PasswordGeneratorInput): string {
  let chars = 'abcdefghijklmnopqrstuvwxyz'
  if (input.uppercase) chars += 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'
  if (input.numbers) chars += '0123456789'
  if (input.symbols) chars += '!@#$%^&*()_+-=[]{}|;:,.<>?'
  return chars
}
```

**`index.ts`:**

```typescript
import type { Tool } from '@mirror/core'
import { schema } from './schema'
import { execute } from './execute'

export const passwordGeneratorTool: Tool = {
  id: 'password-generator',
  description: 'Generates a cryptographically secure random password',
  schema,
  execute,
}
```

### 7.3 `packages/tools/password-manager`

Herramienta con estado persistido. Requiere `ctx.userId` y `ctx.db`.

**`schema.ts`:**

```typescript
import { z } from 'zod'

export const saveSchema = z.object({
  action: z.literal('save'),
  name: z.string().min(1).max(100),
  password: z.string().min(1),
  url: z.string().url().optional(),
  notes: z.string().max(500).optional(),
})

export const getSchema = z.object({
  action: z.literal('get'),
  name: z.string().min(1).max(100),
})

export const deleteSchema = z.object({
  action: z.literal('delete'),
  name: z.string().min(1).max(100),
})

export const listSchema = z.object({
  action: z.literal('list'),
})

export const schema = z.discriminatedUnion('action', [
  saveSchema,
  getSchema,
  deleteSchema,
  listSchema,
])

export type PasswordManagerInput = z.infer<typeof schema>
```

**`execute.ts`:**

```typescript
import type { PasswordManagerInput } from './schema'
import type { ToolContext, ToolResult } from '@mirror/core'
import { PasswordRepository } from './repository'
import { encryptPassword, decryptPassword } from './crypto'

export async function execute(
  input: PasswordManagerInput,
  ctx: ToolContext
): Promise<ToolResult<unknown>> {
  if (!ctx.userId) {
    return {
      success: false,
      error: { code: 'UNAUTHORIZED', message: 'Authentication required' },
    }
  }
  if (!ctx.db) {
    return {
      success: false,
      error: { code: 'EXECUTION_ERROR', message: 'Database not available' },
    }
  }

  const repo = new PasswordRepository(ctx.db)

  switch (input.action) {
    case 'save': {
      const encrypted = await encryptPassword(input.password, ctx.userId)
      await repo.save({
        userId: ctx.userId,
        name: input.name,
        encrypted,
        url: input.url,
        notes: input.notes,
      })
      return { success: true, data: { saved: true } }
    }
    case 'get': {
      const entry = await repo.findByName(ctx.userId, input.name)
      if (!entry) {
        return {
          success: false,
          error: {
            code: 'NOT_FOUND',
            message: `No entry found for "${input.name}"`,
          },
        }
      }
      const password = await decryptPassword(entry.encrypted, ctx.userId)
      return {
        success: true,
        data: { name: entry.name, password, url: entry.url },
      }
    }
    case 'delete': {
      const deleted = await repo.delete(ctx.userId, input.name)
      if (!deleted) {
        return {
          success: false,
          error: {
            code: 'NOT_FOUND',
            message: `No entry found for "${input.name}"`,
          },
        }
      }
      return { success: true, data: { deleted: true } }
    }
    case 'list': {
      const entries = await repo.listByUser(ctx.userId)
      return {
        success: true,
        data: { entries: entries.map((e) => ({ name: e.name, url: e.url })) },
      }
    }
  }
}
```

---

## 8. Aplicaciones

### 8.1 `apps/cli`

Interfaz de línea de comandos. Registra las herramientas y delega la ejecución al core.

**Estructura:**

```
apps/cli/
├── src/
│   ├── index.ts            → punto de entrada, registra las tools
│   └── commands/
│       └── password.ts     → comandos password
├── package.json
└── tsconfig.json
```

**`src/index.ts`:**

```typescript
import { Command } from 'commander'
import { registry } from '@mirror/core'
import { passwordGeneratorTool } from '@mirror/tools-password-generator'
import { passwordManagerTool } from '@mirror/tools-password-manager'
import { passwordCommand } from './commands/password'

// Registro de tools
registry.register(passwordGeneratorTool)
registry.register(passwordManagerTool)

const program = new Command()
  .name('mirror')
  .description('Mirror — modular tools platform')
  .version('0.1.0')

program.addCommand(passwordCommand)
program.parse()
```

**`src/commands/password.ts`:**

```typescript
import { Command } from 'commander'
import { execute } from '@mirror/core'

export const passwordCommand = new Command('password').description('Password tools')

passwordCommand
  .command('generate')
  .description('Generate a secure password')
  .option('-l, --length <number>', 'Password length', '16')
  .option('--symbols', 'Include symbols', false)
  .option('--no-numbers', 'Exclude numbers')
  .option('--no-uppercase', 'Exclude uppercase letters')
  .action(async (options) => {
    const result = await execute({
      toolId: 'password-generator',
      input: {
        length: parseInt(options.length),
        symbols: options.symbols,
        numbers: options.numbers,
        uppercase: options.uppercase,
      },
    })

    if (result.success) {
      console.log(result.data.password)
    } else {
      console.error(`Error [${result.error.code}]: ${result.error.message}`)
      process.exit(1)
    }
  })
```

### 8.2 `apps/api`

Backend REST Fastify. Expuesto en fase 3.

**Estructura:**

```
apps/api/
├── src/
│   ├── index.ts            → arranque servidor
│   ├── plugins/            → auth, cors, rate-limit
│   └── routes/
│       └── tools.ts        → POST /tools/:toolId
├── package.json
└── tsconfig.json
```

**Endpoint genérico:**

```typescript
// POST /tools/:toolId
// Body: { input: unknown }
// Headers: Authorization: Bearer <token>

fastify.post(
  '/tools/:toolId',
  {
    preHandler: [verifyJWT],
  },
  async (request, reply) => {
    const { toolId } = request.params as { toolId: string }
    const { input } = request.body as { input: unknown }

    const result = await execute({
      toolId,
      input,
      contextOverrides: {
        userId: request.user.id,
        db: fastify.db,
      },
    })

    const statusCode = result.success ? 200 : getErrorStatus(result.error.code)
    return reply.status(statusCode).send(result)
  }
)
```

---

## 9. Seguridad y criptografía

### 9.1 Estrategia de cifrado

> **Principio crítico:** las contraseñas se cifran con una clave derivada de **la clave maestra del usuario**, no del servidor. El servidor nunca puede leer las contraseñas almacenadas.

**Flujo de cifrado:**

```
contraseña maestra del usuario
  → PBKDF2 / Argon2id  → clave de cifrado derivada (256 bits)
  → AES-256-GCM        → cifrado de contraseña
  → IV + tag + ciphertext almacenados en base de datos
```

### 9.2 `packages/crypto`

```
packages/crypto/
├── src/
│   ├── index.ts
│   ├── hash.ts         → hashPassword (Argon2id) + verifyPassword
│   ├── derive.ts       → deriveKey (PBKDF2/Argon2) desde userId + secret
│   ├── encrypt.ts      → encryptAES256GCM
│   └── decrypt.ts      → decryptAES256GCM
```

**`hash.ts` — para contraseñas de cuenta (auth):**

```typescript
import { hash, verify } from 'argon2'

export async function hashPassword(password: string): Promise<string> {
  return hash(password, {
    type: 2, // Argon2id
    memoryCost: 65536, // 64 MB
    timeCost: 3,
    parallelism: 4,
  })
}

export async function verifyPassword(hash: string, password: string): Promise<boolean> {
  return verify(hash, password)
}
```

**`encrypt.ts` — para datos sensibles:**

```typescript
import { randomBytes, createCipheriv } from 'node:crypto'

export function encryptAES256GCM(plaintext: string, key: Buffer): string {
  const iv = randomBytes(12) // 96 bits para GCM
  const cipher = createCipheriv('aes-256-gcm', key, iv)

  const encrypted = Buffer.concat([cipher.update(plaintext, 'utf8'), cipher.final()])
  const tag = cipher.getAuthTag()

  // Almacenamiento: iv:tag:ciphertext en base64
  return [iv.toString('base64'), tag.toString('base64'), encrypted.toString('base64')].join(':')
}
```

### 9.3 Almacenamiento de contraseñas

```sql
-- Tabla passwords
CREATE TABLE passwords (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name        VARCHAR(100) NOT NULL,
  encrypted   TEXT NOT NULL,     -- iv:tag:ciphertext en base64
  url         TEXT,
  notes       TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, name)
);
```

### 9.4 Otras medidas de seguridad

- **Rate limiting** en todos los endpoints API (Fastify rate-limit)
- **JWT** con expiración corta (15 min access token, 7 días refresh token)
- **Validación estricta** de todo input vía Zod antes de cualquier operación
- **Logs de auditoría** de todas las ejecuciones de herramientas (toolId, userId, success, timestamp)
- **Variables de env obligatorias** validadas al arranque — el proceso rechaza arrancar si faltan
- **Sin secretos en texto plano** en los logs (Pino redact)

---

## 10. Base de datos

### 10.1 `packages/database`

```
packages/database/
├── src/
│   ├── index.ts            → exports cliente + schema
│   ├── client.ts           → conexión Drizzle
│   ├── schema/
│   │   ├── index.ts
│   │   ├── users.ts
│   │   └── passwords.ts
│   └── repositories/
│       ├── users.ts
│       └── passwords.ts
├── drizzle.config.ts
└── migrations/             → generadas por drizzle-kit
```

### 10.2 Schema Drizzle

```typescript
// packages/database/src/schema/users.ts
import { pgTable, uuid, varchar, timestamp } from 'drizzle-orm/pg-core'

export const users = pgTable('users', {
  id: uuid('id').defaultRandom().primaryKey(),
  email: varchar('email', { length: 255 }).notNull().unique(),
  passwordHash: varchar('password_hash', { length: 255 }).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
})

// packages/database/src/schema/passwords.ts
export const passwords = pgTable('passwords', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: uuid('user_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  name: varchar('name', { length: 100 }).notNull(),
  encrypted: text('encrypted').notNull(),
  url: text('url'),
  notes: text('notes'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
})
```

---

## 11. Tests

### 11.1 Estrategia

| Tipo        | Herramienta        | Qué prueba                              |
| ----------- | ------------------ | --------------------------------------- |
| Unit        | Vitest             | Cada tool aisladamente, funciones puras |
| Integración | Vitest             | core + tool juntos, con DB de prueba    |
| E2E CLI     | Vitest + execa     | Comandos CLI reales                     |
| E2E API     | Vitest + supertest | Endpoints REST reales                   |

### 11.2 Probar una herramienta aisladamente

```typescript
// packages/tools/password-generator/src/execute.test.ts
import { describe, it, expect } from 'vitest'
import { passwordGeneratorTool } from './index'
import { buildContext } from '@mirror/core'

describe('password-generator', () => {
  const ctx = buildContext()

  it('generates password of correct length', async () => {
    const result = await passwordGeneratorTool.execute(
      { length: 20, uppercase: true, numbers: true, symbols: false },
      ctx
    )
    expect(result.success).toBe(true)
    if (result.success) expect(result.data.password).toHaveLength(20)
  })

  it('returns error for empty charset', async () => {
    const result = await passwordGeneratorTool.execute(
      { length: 16, uppercase: false, numbers: false, symbols: false },
      ctx
    )
    expect(result.success).toBe(false)
    if (!result.success) expect(result.error.code).toBe('VALIDATION_ERROR')
  })

  it('uses cryptographically secure randomness', async () => {
    const passwords = await Promise.all(
      Array.from({ length: 10 }, () =>
        passwordGeneratorTool.execute(
          { length: 16, uppercase: true, numbers: true, symbols: true },
          ctx
        )
      )
    )
    const unique = new Set(passwords.map((r) => r.success && r.data.password))
    expect(unique.size).toBe(10) // todos diferentes
  })
})
```

### 11.3 Reglas de test

- Cada herramienta debe tener pruebas unitarias cubriendo: caso nominal, casos de error, validación del schema
- El core debe ser probado: tool no encontrada, error de validación, error de ejecución
- Los repositorios deben ser probados con base PostgreSQL de prueba (contenedor Docker)
- Cobertura mínima: **80% en `packages/`**

---

## 12. Infraestructura

### 12.1 Docker Compose (desarrollo local)

```yaml
# infrastructure/docker/compose.yml
version: '3.9'

services:
  postgres:
    image: postgres:16-alpine
    environment:
      POSTGRES_DB: mirror_dev
      POSTGRES_USER: mirror
      POSTGRES_PASSWORD: mirror_dev_password
    ports:
      - '5432:5432'
    volumes:
      - postgres_data:/var/lib/postgresql/data

volumes:
  postgres_data:
```

### 12.2 Variables de entorno

Archivo `.env.example` en la raíz del proyecto:

```bash
# Entorno
NODE_ENV=development

# Base de datos
DATABASE_URL=postgresql://mirror:mirror_dev_password@localhost:5432/mirror_dev

# Autenticación
JWT_SECRET=change_me_to_a_random_string_of_at_least_32_characters

# Logs
LOG_LEVEL=info
```

**Reglas:**

- El archivo `.env` está en `.gitignore`
- El archivo `.env.example` se commitea con valores ficticios
- Todas las variables se validan al arranque por `packages/config`

---

## 13. Convenciones de código

### 13.1 TypeScript

- `strict: true` — obligatorio, nunca se contornea
- Sin `any` — usar `unknown` y refinar el tipo
- Sin `!` (aserción de no-null) — manejar el caso `undefined` explícitamente
- Sin `enum` TypeScript — usar `z.enum()` o uniones de strings
- `type` en lugar de `interface` para tipos utilitarios, `interface` para contratos

### 13.2 Nombrado

| Elemento            | Convención           | Ejemplo                     |
| ------------------- | -------------------- | --------------------------- |
| Archivos            | kebab-case           | `password-generator.ts`     |
| Variables/funciones | camelCase            | `buildContext`, `toolId`    |
| Tipos/interfaces    | PascalCase           | `ToolContext`, `ToolResult` |
| Constantes          | SCREAMING_SNAKE_CASE | `MAX_PASSWORD_LENGTH`       |
| IDs de herramientas | kebab-case           | `"password-generator"`      |

### 13.3 Estructura de un archivo

```typescript
// 1. Imports externos
import { z } from 'zod'
import type { Logger } from 'pino'

// 2. Imports internos (@mirror/...)
import type { ToolContext } from '@mirror/core'

// 3. Tipos locales
interface LocalType { ... }

// 4. Constantes
const MAX_LENGTH = 128

// 5. Lógica
export function myFunction() { ... }

// 6. Exports por defecto al final (si es necesario)
```

### 13.4 Git

- Ramas: `feat/`, `fix/`, `chore/`, `docs/`
- Commits: [Conventional Commits](https://www.conventionalcommits.org/) — `feat(core): add tool registry`, `fix(crypto): handle empty key`
- Sin commits directos en `main`
- PR obligatoria para cualquier merge

---

## 14. Roadmap

### Fase 1 — Fundación (objetivo: `mirror password generate` que funciona)

**Qué construimos:**

- Scaffolding del monorepo (pnpm, turborepo, tsconfig)
- `packages/core`: tipos, registry, engine, context
- `packages/errors`
- `packages/logger`
- `packages/tools/password-generator`
- `apps/cli`: comando `password generate`

**Criterio de éxito:**

```bash
mirror password generate --length 20 --symbols
# → xK#9mP!2nQ@5rL&7vZ*1
```

**Lo que no construimos aún:** base de datos, auth, API, docker.

---

### Fase 2 — Persistencia (objetivo: `mirror password save/get` con cifrado)

**Qué construimos:**

- `packages/config`: validación env
- `packages/database`: Drizzle, schema users + passwords, migraciones
- `packages/crypto`: Argon2, AES-256-GCM
- `packages/auth`: JWT
- `packages/tools/password-manager`
- `infrastructure/docker/compose.yml`
- Extensión de `apps/cli`: comandos `password save`, `password get`, `password list`, `password delete`

**Criterio de éxito:**

```bash
mirror auth login --email user@example.com
mirror password save --name github --password mySecretPwd123
mirror password get --name github
# → mySecretPwd123
```

---

### Fase 3 — API REST (objetivo: exponer las herramientas vía HTTP)

**Qué construimos:**

- `apps/api`: Fastify, rutas `/tools/:toolId`, `/auth/login`, `/auth/register`
- Middleware de auth JWT
- Rate limiting

---

### Fase 4 — Web y TUI

**Qué construimos:**

- `apps/web`: Next.js, dashboard, gestión de contraseñas
- `apps/tui`: Ink, navegación con teclado

---

### Fase 5 — Discord y Workers

**Qué construimos:**

- `apps/discord-bot`: slash commands
- `apps/workers` + Redis + BullMQ: jobs asincronos

---

### Fase 6 — Workflows e IA

**Qué construimos:**

- Sistema de workflows: encadenar herramientas (`search → summarize → send`)
- Integración IA: herramientas llamables por un LLM
- Agentes autónomos

---

## 15. Glosario

| Término                    | Definición                                                                                            |
| -------------------------- | ----------------------------------------------------------------------------------------------------- |
| **Tool**                   | Un módulo autónomo con un identificador, un schema de validación, y una función `execute`.            |
| **Core**                   | El motor central: registry + engine. Todas las apps dependen de este.                                 |
| **Registry**               | El registro de herramientas. Se registra una tool una vez, y se la recupera por su ID.                |
| **Engine**                 | La función `execute(toolId, input, ctx)` que orquesta validación + ejecución.                         |
| **ToolContext**            | El contexto inyectado en cada herramienta: requestId, userId, logger, db, permissions.                |
| **ToolResult**             | El tipo unión de retorno: `{ success: true, data }` o `{ success: false, error }`.                    |
| **App**                    | Una interfaz consumidora del core. No contiene ninguna lógica de negocio.                             |
| **Package**                | Un módulo reutilizable en `packages/`. Puede ser importado por apps u otros packages.                 |
| **Monorepo**               | Un repositorio git que contiene múltiples packages y aplicaciones relacionadas al mismo proyecto.     |
| **Herramienta sin estado** | Una herramienta que no necesita base de datos ni usuario autenticado. Ej: `password-generator`.       |
| **Herramienta con estado** | Una herramienta que persiste datos en base. Requiere `ctx.db` y `ctx.userId`. Ej: `password-manager`. |

---

_Documento mantenido con el proyecto. Toda decisión de arquitectura que se desvíe de este documento debe documentarse en `docs/decisions/`._
