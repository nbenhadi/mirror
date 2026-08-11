import { stat } from 'node:fs/promises'
import { sep } from 'node:path'

export async function isDirectoryLike(path: string): Promise<boolean> {
  if (path.endsWith('/') || path.endsWith(sep)) return true
  try {
    return (await stat(path)).isDirectory()
  } catch {
    return false
  }
}
