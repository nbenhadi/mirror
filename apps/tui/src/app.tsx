import React, { useState, useEffect } from 'react'
import { registry } from '@nbenhadi/mirror-core'
import { HomeScreen } from './screens/home-screen.js'
import { GenericScreen } from './screens/generic-screen.js'
import { getToolProps } from './utils/tool-nav.js'
import { getResultRenderer } from './utils/result-renderers.js'
import type { Screen, Navigate } from './navigation.js'

export type { Screen, Navigate }

type Phase = { mode: 'show'; screen: Screen } | { mode: 'clear'; next: Screen }

export function App() {
  const [phase, setPhase] = useState<Phase>({ mode: 'show', screen: { id: 'home' } })
  const navigate: Navigate = (next) => setPhase({ mode: 'clear', next })

  useEffect(() => {
    if (phase.mode !== 'clear') return
    const { next } = phase
    const id = setTimeout(() => {
      process.stdout.write('\x1b[2J\x1b[3J\x1b[H')
      setPhase({ mode: 'show', screen: next })
    }, 0)
    return () => clearTimeout(id)
  }, [phase])

  if (phase.mode === 'clear') return null

  const { screen } = phase

  switch (screen.id) {
    case 'home':
      return <HomeScreen key="home" navigate={navigate} />

    case 'generic': {
      const { toolId, action } = screen
      const tool = registry.get(toolId)
      const toolProps = getToolProps(toolId, action, navigate)
      const renderer = getResultRenderer(toolId)

      return (
        <GenericScreen
          key={action ? `${toolId}:${action}` : toolId}
          tool={tool}
          action={action}
          onSelect={(a) => navigate({ id: 'generic', toolId, action: a })}
          {...toolProps}
          {...(renderer && action && { renderResult: (data) => renderer(action, data) })}
        />
      )
    }
  }
}
