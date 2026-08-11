import { readdir } from 'node:fs/promises'
import { dirname, basename, join } from 'node:path'

export async function completePath(input: string): Promise<string[]> {
  if (input === '') return []

  const dir = input.endsWith('/') ? input : dirname(input)
  const prefix = input.endsWith('/') ? '' : basename(input)

  let entries
  try {
    entries = await readdir(dir, { withFileTypes: true })
  } catch {
    return []
  }

  return entries
    .filter((entry) => entry.name.startsWith(prefix))
    .map((entry) => join(dir, entry.name) + (entry.isDirectory() ? '/' : ''))
    .sort((a, b) => a.localeCompare(b))
}

export function formatPathEntry(full: string): string {
  const isDir = full.endsWith('/')
  const name = basename(isDir ? full.slice(0, -1) : full)
  return isDir ? `${name}/` : name
}
