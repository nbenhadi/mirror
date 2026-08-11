import { access } from 'node:fs/promises'
import type { ToolContext, ToolResult } from '@nbenhadi/mirror-core'
import type { PreviewInput } from '../schema.js'
import { startPreviewServer } from '../engine/preview.js'

export interface PreviewResult {
  url: string
}

export async function preview(
  input: PreviewInput,
  _ctx: ToolContext
): Promise<ToolResult<PreviewResult>> {
  const normalizedInput = { ...input, path: input.path.trim() }
  try {
    await access(normalizedInput.path)
  } catch {
    return {
      success: false,
      error: {
        code: 'NOT_FOUND',
        message: 'error.not_found',
        params: { path: normalizedInput.path },
      },
    }
  }

  const server = await startPreviewServer(normalizedInput.path, normalizedInput.port)
  return { success: true, data: { url: server.url } }
}
