import { describe, it, expect, afterEach } from 'vitest'
import { createLogger } from './logger.js'

describe('createLogger', () => {
  const originalEnv = process.env['NODE_ENV']

  afterEach(() => {
    process.env['NODE_ENV'] = originalEnv
  })

  it('returns a logger instance', () => {
    const logger = createLogger()
    expect(logger).toBeDefined()
    expect(typeof logger.info).toBe('function')
    expect(typeof logger.error).toBe('function')
    expect(typeof logger.warn).toBe('function')
  })

  it('returns a child logger when context provided', () => {
    const logger = createLogger({ requestId: 'abc-123' })
    expect(logger).toBeDefined()
    expect(typeof logger.info).toBe('function')
  })

  it('respects LOG_LEVEL env variable', () => {
    process.env['LOG_LEVEL'] = 'debug'
    const logger = createLogger()
    expect(logger.level).toBe('debug')
  })

  it('defaults to info level', () => {
    delete process.env['LOG_LEVEL']
    const logger = createLogger()
    expect(logger.level).toBe('info')
  })
})
