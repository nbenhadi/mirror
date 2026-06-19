import { existsSync } from 'node:fs'
import type { ToolContext, ToolResult } from '@nbenhadi/mirror-core'
import { loadConfig, saveConfig } from '../config.js'
import type { VaultInput } from '../schema.js'

type PathInput = Extract<VaultInput, { action: 'path' }>

export async function path(
  input: PathInput,
  _ctx: ToolContext
): Promise<ToolResult<{ path: string }>> {
  const config = await loadConfig()

  if (input.newPath === undefined) {
    if (!config.vault) {
      return {
        success: false,
        error: { code: 'NOT_FOUND', message: 'No vault configured' },
      }
    }
    return { success: true, data: { path: config.vault.path } }
  }

  if (!config.vault) {
    return {
      success: false,
      error: { code: 'NOT_FOUND', message: 'No vault initialized. Run `mirror vault init` first.' },
    }
  }

  if (!existsSync(input.newPath)) {
    return {
      success: false,
      error: { code: 'NOT_FOUND', message: `File not found at ${input.newPath}` },
    }
  }

  await saveConfig({ ...config, vault: { ...config.vault, path: input.newPath } })
  return { success: true, data: { path: input.newPath } }
}
