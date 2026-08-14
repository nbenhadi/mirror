import { readdir } from 'node:fs/promises'
import { dirname, basename, join, sep } from 'node:path'

function isDirInput(input: string): boolean {
  return input.endsWith('/') || input.endsWith(sep)
}

export async function completePath(input: string): Promise<string[]> {
  if (input === '') return []

  const dir = isDirInput(input) ? input : dirname(input)
  const prefix = isDirInput(input) ? '' : basename(input)

  let entries
  try {
    entries = await readdir(dir, { withFileTypes: true })
  } catch {
    return []
  }

  return entries
    .filter((entry) => entry.name.startsWith(prefix))
    .map((entry) => join(dir, entry.name) + (entry.isDirectory() ? sep : ''))
    .sort((a, b) => a.localeCompare(b))
}

export function formatPathEntry(full: string): string {
  const isDir = isDirInput(full)
  const name = basename(isDir ? full.slice(0, -1) : full)
  return isDir ? `${name}${sep}` : name
}
