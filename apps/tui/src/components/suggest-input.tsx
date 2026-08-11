import React, { useState, useEffect } from 'react'
import { Box, Text, useInput } from 'ink'
import TextInput from 'ink-text-input'

export interface SuggestInputProps {
  value: string
  onChange: (value: string) => void
  focus: boolean
  placeholder?: string
  onListing?: (text: string | undefined) => void
  fetchSuggestions: (value: string) => Promise<string[]>
  formatEntry?: (candidate: string) => string
}

function formatListing(
  matches: string[],
  formatEntry: (candidate: string) => string
): string | undefined {
  return matches.length > 0 ? matches.map(formatEntry).join(', ') : undefined
}

const identity = (s: string): string => s

export function SuggestInput({
  value,
  onChange,
  focus,
  placeholder,
  onListing,
  fetchSuggestions,
  formatEntry = identity,
}: SuggestInputProps) {
  const [matches, setMatches] = useState<string[]>([])
  const [showListing, setShowListing] = useState(false)
  const [remountKey, setRemountKey] = useState(0)

  useEffect(() => {
    let cancelled = false
    void fetchSuggestions(value).then((results) => {
      if (!cancelled) setMatches(results)
    })

    return () => {
      cancelled = true
    }
  }, [value, fetchSuggestions])

  useEffect(() => {
    if (!focus) {
      setShowListing(false)
      onListing?.(undefined)
      return
    }
    onListing?.(showListing ? formatListing(matches, formatEntry) : undefined)
  }, [focus, showListing, matches, formatEntry, onListing])

  const best = matches.find((match) => match !== value && match.startsWith(value))
  const suggestion = best ? best.slice(value.length) : ''

  useInput(
    (_input, key) => {
      if (key.tab && key.shift) {
        setShowListing((prev) => !prev)
      } else if (key.tab && suggestion) {
        onChange(value + suggestion)
        setRemountKey((k) => k + 1)
      }
    },
    { isActive: focus }
  )

  return (
    <Box>
      <TextInput
        key={remountKey}
        value={value}
        onChange={onChange}
        focus={focus}
        {...(placeholder !== undefined && { placeholder })}
      />
      {focus && suggestion !== '' && <Text dimColor>{suggestion}</Text>}
    </Box>
  )
}
