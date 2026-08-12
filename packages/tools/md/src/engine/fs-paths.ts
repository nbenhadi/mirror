import { stat } from 'node:fs/promises'
import { basename, dirname, extname, resolve, sep } from 'node:path'

export async function isDirectoryLike(path: string): Promise<boolean> {
  if (path.endsWith('/') || path.endsWith(sep)) return true
  try {
    return (await stat(path)).isDirectory()
  } catch {
    return false
  }
}

export function normalizePath<T extends { path: string }>(input: T): T {
  return { ...input, path: input.path.trim() }
}

export function outputFileName(sourcePath: string, extension: string): string {
  return `${basename(sourcePath, extname(sourcePath))}${extension}`
}

export async function resolveOutputPath(
  sourcePath: string,
  output: string | undefined,
  extension: string
): Promise<string> {
  const fileName = outputFileName(sourcePath, extension)
  if (!output) return resolve(dirname(sourcePath), fileName)

  const resolved = resolve(output)
  if (await isDirectoryLike(output)) return resolve(resolved, fileName)

  return resolved
}
