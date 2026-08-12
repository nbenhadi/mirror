import { useState, useCallback } from 'react'
import { execute } from '@nbenhadi/mirror-core'
import { t } from '@nbenhadi/mirror-i18n'

export function useExecute<T>(toolId: string) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const run = useCallback(
    async (input: unknown): Promise<T | null> => {
      setLoading(true)
      setError(null)
      try {
        const result = await execute({ toolId, input })
        if (!result.success) {
          setError(t(result.error.message, result.error.params))
          return null
        }
        return result.data as T
      } finally {
        setLoading(false)
      }
    },
    [toolId]
  )

  return { run, loading, error, clearError: () => setError(null) }
}
