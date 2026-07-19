import pino from 'pino'
import { isDev } from '@nbenhadi/mirror-config'

export function createLogger(context?: Record<string, unknown>) {
  const dev = isDev()

  const base = pino({
    level: process.env['LOG_LEVEL'] ?? 'info',
    ...(dev && { transport: { target: 'pino-pretty' } }),
  })

  return context ? base.child(context) : base
}

export type Logger = ReturnType<typeof createLogger>
