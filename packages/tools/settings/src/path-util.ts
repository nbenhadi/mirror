import { isPlainObject } from '@nbenhadi/mirror-config'

export function getByPath(obj: unknown, key: string): unknown {
  let current: unknown = obj
  for (const segment of key.split('.')) {
    if (!isPlainObject(current)) return undefined
    current = current[segment]
  }
  return current
}

export function setByPath(obj: Record<string, unknown>, path: string, value: unknown): void {
  const parts = path.split('.')
  let cur = obj
  for (let i = 0; i < parts.length - 1; i++) {
    const p = parts[i]!
    if (typeof cur[p] !== 'object' || cur[p] === null) cur[p] = {}
    cur = cur[p] as Record<string, unknown>
  }
  cur[parts[parts.length - 1]!] = value
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
