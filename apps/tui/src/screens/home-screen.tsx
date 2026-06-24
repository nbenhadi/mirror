import React, { useState, useEffect } from 'react'
import { Box, Text, useInput } from 'ink'
import { registry } from '@nbenhadi/mirror-core'
import { t, type TranslationKey } from '@nbenhadi/mirror-i18n'
import { Logo } from '../components/logo.js'
import { Separator } from '../components/separator.js'
import { Selector } from '../components/selector.js'
import { Footer } from '../components/footer.js'
import { useFlash } from '../hooks/use-flash.js'
import { useQuitConfirm } from '../hooks/use-quit-confirm.js'
import { useTerminalSize } from '../hooks/use-terminal-size.js'
import { colors, dim } from '../theme.js'
import { keybindings } from '../utils/keybindings.js'
import { getSubcommands } from '../utils/schema-to-fields.js'
import { resolveToolEntry } from '../utils/tool-nav.js'
import { capitalize } from '../utils/capitalize.js'
import type { Navigate } from '../navigation.js'
import pkg from '../../package.json' with { type: 'json' }

const LOGO_WIDTH = 74

interface HomeScreenProps {
  navigate: Navigate
}

export function HomeScreen({ navigate }: HomeScreenProps) {
  const tools = registry.list()
  const [cursor, setCursor] = useState(0)
  const [disableAnimation, setDisableAnimation] = useState(false)
  const [pendingToolId, setPendingToolId] = useState<string | null>(null)
  const { width } = useTerminalSize()
  const { flash, notify } = useFlash()
  useQuitConfirm(notify)

  const maxTitleLen = Math.max(0, ...tools.map((tool) => tool.id.length))
  const centerPad = Math.max(0, Math.floor((width - LOGO_WIDTH) / 2))

  useEffect(() => {
    if (!pendingToolId) return
    const toolId = pendingToolId
    setPendingToolId(null)
    void resolveToolEntry(toolId).then((override) => {
      if (override) {
        navigate(override)
        return
      }
      const tool = registry.get(toolId)
      const subs = getSubcommands(tool.schema)
      if (subs.length === 1 && subs[0]) {
        navigate({ id: 'generic', toolId, action: subs[0].action })
      } else {
        navigate({ id: 'generic', toolId })
      }
    })
  }, [pendingToolId, navigate])

  useInput((_input, key) => {
    setDisableAnimation(true)
    if (key.return) {
      const tool = tools[cursor]
      if (!tool) return
      setPendingToolId(tool.id)
    }
  })

  return (
    <Box flexDirection="column">
      <Box marginLeft={centerPad} marginTop={1}>
        <Box flexDirection="column" width={LOGO_WIDTH}>
          <Logo disableAnimation={disableAnimation} />
          <Box justifyContent="center" marginTop={1}>
            <Text {...dim}>{capitalize(t('program.description'))}</Text>
          </Box>
          <Box justifyContent="center">
            <Text {...dim}>{process.cwd()}</Text>
          </Box>
          <Box justifyContent="center">
            <Text {...dim}>v{pkg.version}</Text>
          </Box>
        </Box>
      </Box>

      <Box marginTop={1}>
        <Separator label={capitalize(t('tui.select_tool'))} labelColor={colors.info} />
      </Box>

      <Box flexDirection="column">
        <Selector
          items={tools}
          cursor={cursor}
          onCursorChange={setCursor}
          keyExtractor={(tool) => tool.id}
          renderItem={(tool, selected) => {
            const desc = capitalize(t(`cmd.${tool.id}.description` as TranslationKey))
            const title = tool.id.padEnd(maxTitleLen)
            return (
              <Box gap={3}>
                <Text {...(selected ? { color: colors.primary } : dim)}>{title}</Text>
                <Text {...(selected ? { color: colors.primary } : dim)}>{desc}</Text>
              </Box>
            )
          }}
        />
      </Box>

      <Footer
        keys={[
          { key: keybindings.navigate.label, label: t('tui.key.navigate') },
          { key: keybindings.select.label, label: t('tui.key.select') },
        ]}
        flash={flash}
      />
    </Box>
  )
}
