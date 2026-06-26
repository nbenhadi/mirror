import type { ToolContext, ToolResult } from '@nbenhadi/mirror-core'
import type { CheckInput } from '../schema.js'

export type StrengthLabel = 'very-weak' | 'weak' | 'fair' | 'strong' | 'very-strong'

export type WarningCode = 'too-short' | 'single-type' | 'repeated-run' | 'sequence' | 'low-variety'

export type Severity = 'danger' | 'warning' | 'success'

export interface CheckResult {
  length: number
  poolSize: number
  entropyBits: number
  effectiveBits: number
  score: 0 | 1 | 2 | 3 | 4
  label: StrengthLabel
  severity: Severity
  crackTime: string
  warnings: WarningCode[]
}

const LOWER = /[a-z]/
const UPPER = /[A-Z]/
const DIGIT = /[0-9]/
const SYMBOL = /[!-/:-@[-`{-~]/

function poolSize(password: string): number {
  let pool = 0
  if (LOWER.test(password)) pool += 26
  if (UPPER.test(password)) pool += 26
  if (DIGIT.test(password)) pool += 10
  if (SYMBOL.test(password)) pool += 32

  const exotic = new Set(
    password
      .split('')
      .filter((c) => !LOWER.test(c) && !UPPER.test(c) && !DIGIT.test(c) && !SYMBOL.test(c))
  )
  pool += exotic.size

  return pool
}

function hasSequentialRun(password: string): boolean {
  for (let i = 0; i < password.length - 2; i++) {
    const a = password.charCodeAt(i)
    const b = password.charCodeAt(i + 1)
    const c = password.charCodeAt(i + 2)
    if ((b - a === 1 && c - b === 1) || (a - b === 1 && b - c === 1)) return true
  }
  return false
}

function hasRepeatedRun(password: string): boolean {
  return /(.)\1\1/.test(password)
}

function collectWarnings(password: string, uniqueRatio: number): WarningCode[] {
  const warnings: WarningCode[] = []
  if (password.length < 8) warnings.push('too-short')
  if (poolSize(password) <= 26) warnings.push('single-type')
  if (hasRepeatedRun(password)) warnings.push('repeated-run')
  if (hasSequentialRun(password)) warnings.push('sequence')
  if (uniqueRatio < 0.5 && password.length >= 8) warnings.push('low-variety')
  return warnings
}

function crackTime(effectiveBits: number): string {
  const GUESSES_PER_SEC = 1e10
  const seconds = Math.pow(2, effectiveBits - 1) / GUESSES_PER_SEC

  if (!Number.isFinite(seconds) || seconds > 3.15e9 * 100) return 'centuries'
  if (seconds < 1) return 'instant'

  const units: Array<[string, number]> = [
    ['year', 31_557_600],
    ['day', 86_400],
    ['hour', 3_600],
    ['minute', 60],
    ['second', 1],
  ]
  for (const [name, size] of units) {
    if (seconds >= size) {
      const value = Math.round(seconds / size)
      return `${value} ${name}${value === 1 ? '' : 's'}`
    }
  }
  return 'instant'
}

function scoreFor(effectiveBits: number): { score: CheckResult['score']; label: StrengthLabel } {
  if (effectiveBits < 28) return { score: 0, label: 'very-weak' }
  if (effectiveBits < 36) return { score: 1, label: 'weak' }
  if (effectiveBits < 60) return { score: 2, label: 'fair' }
  if (effectiveBits < 128) return { score: 3, label: 'strong' }
  return { score: 4, label: 'very-strong' }
}

function severityFor(score: number): Severity {
  if (score <= 1) return 'danger'
  if (score === 2) return 'warning'
  return 'success'
}

export async function check(
  input: CheckInput,
  _ctx: ToolContext
): Promise<ToolResult<CheckResult>> {
  const { password } = input
  const length = password.length
  const pool = poolSize(password)

  const uniqueRatio = new Set(password.split('')).size / length
  const entropyBits = Math.round(length * Math.log2(pool))

  let penalty = 1
  if (hasRepeatedRun(password)) penalty *= 0.7
  if (hasSequentialRun(password)) penalty *= 0.7
  if (uniqueRatio < 0.5) penalty *= 0.7
  const effectiveBits = Math.round(entropyBits * penalty)

  const { score, label } = scoreFor(effectiveBits)
  const warnings = collectWarnings(password, uniqueRatio)

  return {
    success: true,
    data: {
      length,
      poolSize: pool,
      entropyBits,
      effectiveBits,
      score,
      label,
      severity: severityFor(score),
      crackTime: crackTime(effectiveBits),
      warnings,
    },
  }
}
