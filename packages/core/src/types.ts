import type { ZodType, ZodTypeDef } from 'zod'
import type { Logger } from '@mirror/logger'

export interface ToolContext {
  requestId: string
  userId?: string
  logger: Logger
  permissions: string[]
}

export type ToolResult<T> = { success: true; data: T } | { success: false; error: ToolError }

export interface ToolError {
  code: ToolErrorCode
  message: string
  details?: unknown
}

export type ToolErrorCode =
  | 'VALIDATION_ERROR'
  | 'NOT_FOUND'
  | 'UNAUTHORIZED'
  | 'FORBIDDEN'
  | 'EXECUTION_ERROR'
  | 'CRYPTO_ERROR'
  | 'DATABASE_ERROR'

export interface Tool<TInput = unknown, TOutput = unknown> {
  id: string
  description: string
  schema: ZodType<TInput, ZodTypeDef, unknown>
  execute: (input: TInput, ctx: ToolContext) => Promise<ToolResult<TOutput>>
}
