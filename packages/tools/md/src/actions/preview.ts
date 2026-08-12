import { access } from 'node:fs/promises'
import type { ToolContext, ToolResult } from '@nbenhadi/mirror-core'
import type { PreviewInput } from '../schema.js'
import { startPreviewServerSafe } from '../engine/preview.js'
import { normalizePath } from '../engine/fs-paths.js'

export interface PreviewResult {
  url: string
}

export async function preview(
  input: PreviewInput,
  _ctx: ToolContext
): Promise<ToolResult<PreviewResult>> {
  const normalizedInput = normalizePath(input)
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

  const started = await startPreviewServerSafe(normalizedInput.path, normalizedInput.port)
  if (!started.success) return started
  return { success: true, data: { url: started.server.url } }
}
