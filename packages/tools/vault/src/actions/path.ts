import { existsSync, readdirSync, statSync } from 'node:fs'
import type { ToolContext, ToolResult } from '@nbenhadi/mirror-core'
import { loadConfig, saveConfig, vaultDirFromPath } from '../config.js'
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
        error: { code: 'NOT_FOUND', message: 'tool.vault.error.not_initialized' },
      }
    }
    return { success: true, data: { path: config.vault.path } }
  }

  if (!existsSync(input.newPath)) {
    return {
      success: false,
      error: {
        code: 'NOT_FOUND',
        message: 'tool.vault.error.file_not_found',
        params: { path: input.newPath },
      },
    }
  }

  const stats = statSync(input.newPath)

  if (stats.isDirectory()) {
    const vaultFiles = readdirSync(input.newPath).filter((f) => f.endsWith('.vault'))
    if (vaultFiles.length === 0) {
      return {
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: 'tool.vault.error.no_vault_in_dir',
          params: { path: input.newPath },
        },
      }
    }
    await saveConfig({ vault: { path: input.newPath } })
    return { success: true, data: { path: input.newPath } }
  }

  if (!stats.isFile()) {
    return {
      success: false,
      error: {
        code: 'VALIDATION_ERROR',
        message: 'tool.vault.error.not_a_file',
        params: { path: input.newPath },
      },
    }
  }

  try {
    await getVaultSaltAndKdf(input.newPath)
  } catch {
    return {
      success: false,
      error: {
        code: 'VALIDATION_ERROR',
        message: 'tool.vault.error.invalid_vault_file',
        params: { path: input.newPath },
      },
    }
  }

  const vaultDir = vaultDirFromPath(input.newPath)
  await saveConfig({ vault: { path: vaultDir } })
  return { success: true, data: { path: vaultDir } }
}
