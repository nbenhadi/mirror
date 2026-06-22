#!/usr/bin/env node
import { spawnSync } from 'node:child_process'
import { readFileSync, existsSync } from 'node:fs'
import { join } from 'node:path'
import { homedir } from 'node:os'
import { fileURLToPath } from 'node:url'
import { createRequire } from 'node:module'
import React from 'react'
import { render } from 'ink'
import { registry } from '@nbenhadi/mirror-core'
import { setLocale, SUPPORTED_LOCALES, type Locale } from '@nbenhadi/mirror-i18n'
import { App } from './app.js'
import { TerminalSizeProvider } from './hooks/use-terminal-size.js'

const args = process.argv.slice(2)

if (args.length > 0) {
  // Passthrough: `mir <args>` delegates to the CLI; `mir` alone opens the TUI.
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

  // Dev fallback: the CLI is not built yet, run its TypeScript source via tsx.
  const source = fileURLToPath(new URL('../../cli/src/index.ts', import.meta.url))
  const result = spawnSync('tsx', [source, ...cliArgs], { stdio: 'inherit' })
  return result.status ?? (result.error ? 1 : 0)
}

function readLocale(): string | undefined {
  const configFile = join(homedir(), '.mirror', 'config.json')
  if (!existsSync(configFile)) return undefined
  try {
    const cfg = JSON.parse(readFileSync(configFile, 'utf8')) as { locale?: string }
    return cfg.locale
  } catch {
    return undefined
  }
}

async function start() {
  const locale = readLocale()
  if (locale && (SUPPORTED_LOCALES as readonly string[]).includes(locale)) {
    setLocale(locale as Locale)
  }

  const { passwordTool } = await import('@nbenhadi/mirror-password')
  const { vaultTool } = await import('@nbenhadi/mirror-vault')
  registry.register(passwordTool)
  registry.register(vaultTool)

  render(
    <TerminalSizeProvider>
      <App />
    </TerminalSizeProvider>,
    { exitOnCtrlC: false }
  )
}
