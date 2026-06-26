#!/usr/bin/env node
import { spawnSync } from 'node:child_process'
import { existsSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { createRequire } from 'node:module'
import React from 'react'
import { render } from 'ink'
import { registry } from '@nbenhadi/mirror-core'
import { setLocale, SUPPORTED_LOCALES, type Locale } from '@nbenhadi/mirror-i18n'
import { readConfigSync } from '@nbenhadi/mirror-config'
import { App } from './app.js'
import { TerminalSizeProvider } from './hooks/use-terminal-size.js'

const args = process.argv.slice(2)

if (args.length > 0) {
  process.exit(runCli(args))
}

process.stdout.write('\x1b[2J\x1b[3J\x1b[H\x1b[?1004l')
void start()

function runCli(cliArgs: string[]): number {
  const require = createRequire(import.meta.url)
  let entry: string | undefined
  try {
    entry = require.resolve('@nbenhadi/mirror-cli/dist/index.cjs')
  } catch {
    entry = undefined
  }

  if (entry && existsSync(entry)) {
    const result = spawnSync(process.execPath, [entry, ...cliArgs], { stdio: 'inherit' })
    return result.status ?? (result.error ? 1 : 0)
  }

  const source = fileURLToPath(new URL('../../cli/src/index.ts', import.meta.url))
  const result = spawnSync('tsx', [source, ...cliArgs], { stdio: 'inherit' })
  return result.status ?? (result.error ? 1 : 0)
}

function readLocale(): string | undefined {
  return readConfigSync().general?.lang
}

async function start() {
  const locale = readLocale()
  if (locale && (SUPPORTED_LOCALES as readonly string[]).includes(locale)) {
    setLocale(locale as Locale)
  }

  const { passwordTool } = await import('@nbenhadi/mirror-password')
  const { vaultTool } = await import('@nbenhadi/mirror-vault')
  const { settingsTool } = await import('@nbenhadi/mirror-settings')

  registry.register(passwordTool)
  registry.register(vaultTool)
  registry.register(settingsTool)

  render(
    <TerminalSizeProvider>
      <App />
    </TerminalSizeProvider>,
    { exitOnCtrlC: false }
  )
}
