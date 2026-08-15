import { access, writeFile } from 'node:fs/promises'
import { dirname, resolve } from 'node:path'
import type { ToolContext, ToolResult } from '@nbenhadi/mirror-core'
import type { EditInput } from '../schema.js'
import { startPreviewServerSafe } from '../engine/preview.js'
import { isDirectoryLike, ensureDir } from '../engine/fs-paths.js'

export interface EditResult {
  path: string
  url: string
  created: boolean
}

const NEW_DOCUMENT_TEMPLATE = '---\ntitle: untitled\n---\n\n# untitled\n'
const DEFAULT_FILE_NAME = 'untitled.md'

async function fileExists(path: string): Promise<boolean> {
  try {
    await access(path)
    return true
  } catch {
    return false
  }
}

async function resolveEditPath(path: string): Promise<string> {
  if (await isDirectoryLike(path)) return resolve(path, DEFAULT_FILE_NAME)
  return resolve(path)
}

export async function edit(input: EditInput, _ctx: ToolContext): Promise<ToolResult<EditResult>> {
  const path = await resolveEditPath(input.path.trim())

  const created = !(await fileExists(path))
  if (created) {
    await ensureDir(dirname(path))
    await writeFile(path, NEW_DOCUMENT_TEMPLATE, 'utf-8')
  }

  const started = await startPreviewServerSafe(path, input.port)
  if (!started.success) return started
  return { success: true, data: { path, url: started.server.url, created } }
}
