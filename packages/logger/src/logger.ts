import pino from 'pino'

export function createLogger(context?: Record<string, unknown>) {
  const isDev = process.env['NODE_ENV'] === 'development'

  const base = pino({
    level: process.env['LOG_LEVEL'] ?? 'info',
    ...(isDev && { transport: { target: 'pino-pretty' } }),
  })

  return context ? base.child(context) : base
}

export type Logger = ReturnType<typeof createLogger>
