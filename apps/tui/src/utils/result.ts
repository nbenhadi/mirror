export function pickString(data: unknown): string | undefined {
  if (typeof data === 'string') return data
  if (data !== null && typeof data === 'object') {
    return Object.values(data as Record<string, unknown>).find(
      (v): v is string => typeof v === 'string'
    )
  }
  return undefined
}
