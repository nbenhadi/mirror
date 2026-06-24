import { isPlainObject } from '@nbenhadi/mirror-config'

export function getByPath(obj: unknown, key: string): unknown {
  let current: unknown = obj
  for (const segment of key.split('.')) {
    if (!isPlainObject(current)) return undefined
    current = current[segment]
  }
  return current
}

export function buildPatch(key: string, value: unknown): Record<string, unknown> {
  const segments = key.split('.')
  const root: Record<string, unknown> = {}
  let cursor = root
  segments.forEach((segment, i) => {
    if (i === segments.length - 1) {
      cursor[segment] = value
    } else {
      const next: Record<string, unknown> = {}
      cursor[segment] = next
      cursor = next
    }
  })
  return root
}
