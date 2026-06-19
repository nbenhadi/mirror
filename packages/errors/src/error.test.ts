import { describe, it, expect } from 'vitest'
import {
  AppError,
  ValidationError,
  NotFoundError,
  UnauthorizedError,
  ForbiddenError,
} from './error.js'

describe('AppError', () => {
  it('sets code, message, name', () => {
    const err = new AppError('SOME_CODE', 'something failed')
    expect(err.code).toBe('SOME_CODE')
    expect(err.message).toBe('something failed')
    expect(err.name).toBe('AppError')
  })

  it('stores details when provided', () => {
    const details = { field: 'email' }
    const err = new AppError('CODE', 'msg', details)
    expect(err.details).toEqual(details)
  })

  it('is an instance of Error', () => {
    expect(new AppError('C', 'm')).toBeInstanceOf(Error)
  })
})

describe('ValidationError', () => {
  it('has correct code and name', () => {
    const err = new ValidationError('invalid input')
    expect(err.code).toBe('VALIDATION_ERROR')
    expect(err.name).toBe('ValidationError')
    expect(err.message).toBe('invalid input')
  })

  it('is an instance of AppError', () => {
    expect(new ValidationError('x')).toBeInstanceOf(AppError)
  })
})

describe('NotFoundError', () => {
  it('formats message from resource name', () => {
    const err = new NotFoundError('User')
    expect(err.code).toBe('NOT_FOUND')
    expect(err.message).toBe('User not found')
    expect(err.name).toBe('NotFoundError')
  })
})

describe('UnauthorizedError', () => {
  it('uses default message', () => {
    const err = new UnauthorizedError()
    expect(err.code).toBe('UNAUTHORIZED')
    expect(err.message).toBe('Authentication required')
  })

  it('accepts custom message', () => {
    const err = new UnauthorizedError('token expired')
    expect(err.message).toBe('token expired')
  })
})

describe('ForbiddenError', () => {
  it('uses default message', () => {
    const err = new ForbiddenError()
    expect(err.code).toBe('FORBIDDEN')
    expect(err.message).toBe('Insufficient permissions')
  })
})
