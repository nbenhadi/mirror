import { existsSync, statSync } from 'node:fs'
import type { ToolContext, ToolResult } from '@nbenhadi/mirror-core'
import { loadConfig, saveConfig } from '../config.js'
import { getVaultSaltAndKdf } from '../vault-file.js'
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

  // Validate file exists
  if (!existsSync(input.newPath)) {
    return {
      success: false,
      error: { code: 'NOT_FOUND', message: `File not found at ${input.newPath}` },
    }
  }

  // Validate it's a regular file
  const stats = statSync(input.newPath)
  if (!stats.isFile()) {
    return {
      success: false,
      error: { code: 'VALIDATION_ERROR', message: `Path is not a file: ${input.newPath}` },
    }
  }

  // Validate it's a valid vault (can read salt and kdf)
  try {
    await getVaultSaltAndKdf(input.newPath)
  } catch {
    return {
      success: false,
      error: { code: 'VALIDATION_ERROR', message: `Invalid vault file at ${input.newPath}` },
    }
  }

  await saveConfig({ ...config, vault: { path: input.newPath } })
  return { success: true, data: { path: input.newPath } }
}
