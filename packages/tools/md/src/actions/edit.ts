import { access, mkdir, writeFile } from 'node:fs/promises'
import { dirname, resolve } from 'node:path'
import type { ToolContext, ToolResult } from '@nbenhadi/mirror-core'
import type { EditInput } from '../schema.js'
import { startPreviewServer } from '../engine/preview.js'
import { isDirectoryLike } from '../engine/fs-paths.js'

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
    await mkdir(dirname(path), { recursive: true })
    await writeFile(path, NEW_DOCUMENT_TEMPLATE, 'utf-8')
  }

  const server = await startPreviewServer(path, input.port)
  return { success: true, data: { path, url: server.url, created } }
}
