import chalk from 'chalk'
import { colors, symbols } from '@nbenhadi/mirror-brand'

const _primary = chalk.hex(colors.primary)
const _danger = chalk.hex(colors.danger)
const _warning = chalk.hex(colors.warning)
const _success = chalk.hex(colors.success)

export function printSuccess(message: string): void {
  console.log(`${_primary(symbols.tick)} ${message}`)
}

export function printError(message: string): void {
  console.error(`${_danger(symbols.cross)} ${message}`)
}

export function fatal(message: string): never {
  printError(message)
  process.exit(1)
}

export function printPassword(value: string): void {
  console.log(value)
}

export function hint(message: string): void {
  console.log(`  ${chalk.dim(message)}`)
}

export function dimMark(): string {
  return chalk.dim(symbols.separator)
}

export function row(label: string, value: string, width = 14): void {
  console.log(`  ${chalk.dim(label.padEnd(width))}${value}`)
}

export function tableHeader(cols: string[], widths: number[]): void {
  const parts = cols.map((col, i) =>
    chalk.dim(
      widths[i] && i < cols.length - 1
        ? col.toUpperCase().padEnd(widths[i] as number)
        : col.toUpperCase()
    )
  )
  console.log(`\n  ${parts.join('  ')}`)
}

export function tableRow(cols: string[], widths: number[]): void {
  const parts = cols.map((col, i) => {
    const w = widths[i]
    const isEmpty = col === ''
    if (isEmpty) {
      const raw = w && i < cols.length - 1 ? symbols.separator.padEnd(w) : symbols.separator
      return chalk.dim(raw)
    }
    return w && i < cols.length - 1 ? col.padEnd(w) : col
  })
  console.log(`  ${parts.join('  ')}`)
}

function printTableRow(cols: string[]): void {
  console.log(`  ${cols.join('  ')}`)
}

function stripAnsiLength(str: string): number {
  // eslint-disable-next-line no-control-regex
  const ansiRegex = /\x1b\[[0-9;]*m/g
  return str.replace(ansiRegex, '').length
}

export function table(headers: string[], rows: string[][], widths?: number[]): void {
  const calculatedWidths =
    widths ||
    headers.map((h, i) => {
      const maxInCol = Math.max(h.length, ...rows.map((r) => stripAnsiLength(r[i] || '')))
      return maxInCol
    })

  tableHeader(headers, calculatedWidths)
  rows.forEach((row) => {
    const paddedRow = row.map((col, i) => {
      const w = calculatedWidths[i] ?? 0
      const currentLen = stripAnsiLength(col)
      const padding = Math.max(0, w - currentLen)
      return col + ' '.repeat(padding)
    })
    printTableRow(paddedRow)
  })
}

export function strengthColor(score: number): (text: string) => string {
  if (score <= 1) return _danger
  if (score === 2) return _warning
  return _success
}
