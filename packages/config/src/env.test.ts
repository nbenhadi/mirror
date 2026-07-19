import { describe, it, expect, afterEach } from 'vitest'
import { getNodeEnv, isDev, isProd, isTest } from './env.js'

const orig = process.env['NODE_ENV']

afterEach(() => {
  if (orig === undefined) {
    delete process.env['NODE_ENV']
  } else {
    process.env['NODE_ENV'] = orig
  }
})

describe('getNodeEnv', () => {
  it('defaults to development when unset', () => {
    delete process.env['NODE_ENV']
    expect(getNodeEnv()).toBe('development')
  })

  it('returns test', () => {
    process.env['NODE_ENV'] = 'test'
    expect(getNodeEnv()).toBe('test')
  })

  it('returns staging', () => {
    process.env['NODE_ENV'] = 'staging'
    expect(getNodeEnv()).toBe('staging')
  })

  it('returns production', () => {
    process.env['NODE_ENV'] = 'production'
    expect(getNodeEnv()).toBe('production')
  })

  it('falls back to development for unknown value', () => {
    process.env['NODE_ENV'] = 'unknown'
    expect(getNodeEnv()).toBe('development')
  })
})

describe('isDev / isProd / isTest', () => {
  it('isDev returns true when development', () => {
    delete process.env['NODE_ENV']
    expect(isDev()).toBe(true)
  })

  it('isProd returns true when production', () => {
    process.env['NODE_ENV'] = 'production'
    expect(isProd()).toBe(true)
  })

  it('isTest returns true when test', () => {
    process.env['NODE_ENV'] = 'test'
    expect(isTest()).toBe(true)
  })
})
