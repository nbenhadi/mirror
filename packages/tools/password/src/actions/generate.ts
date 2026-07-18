import { randomInt } from 'node:crypto'
import type { ToolContext, ToolResult } from '@nbenhadi/mirror-core'
import type { GenerateInput } from '../schema.js'

const LOWERCASE = 'abcdefghijklmnopqrstuvwxyz'
const UPPERCASE = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'
const NUMBERS = '0123456789'
const SYMBOLS = '!@#$%^&*()_+-=[]{}|;:,.<>?'
const AMBIGUOUS = new Set('0O1lI|')

function buildCharset(input: GenerateInput): string {
  let chars = LOWERCASE
  if (input.uppercase) chars += UPPERCASE
  if (input.numbers) chars += NUMBERS
  if (input.symbols) chars += SYMBOLS

  if (input.excludeAmbiguous) {
    chars = chars
      .split('')
      .filter((c) => !AMBIGUOUS.has(c))
      .join('')
  }

  if (input.exclude !== undefined) {
    const excluded = new Set(input.exclude.split(''))
    chars = chars
      .split('')
      .filter((c) => !excluded.has(c))
      .join('')
  }

  if (input.include !== undefined) {
    const existing = new Set(chars.split(''))
    for (const c of input.include) {
      if (!existing.has(c)) {
        chars += c
        existing.add(c)
      }
    }
  }

  return chars
}

function shuffle(arr: string[]): string[] {
  const result = [...arr]
  for (let i = result.length - 1; i > 0; i--) {
    const j = randomInt(i + 1)
    const temp = result[i]!
    result[i] = result[j]!
    result[j] = temp
  }
  return result
}

function getActiveTypeChars(charset: string, input: GenerateInput): string[] {
  const types: string[] = []
  const fromCharset = (source: string) =>
    charset
      .split('')
      .filter((c) => source.includes(c))
      .join('')

  const lower = fromCharset(LOWERCASE)
  if (lower) types.push(lower)

  if (input.uppercase) {
    const upper = fromCharset(UPPERCASE)
    if (upper) types.push(upper)
  }
  if (input.numbers) {
    const nums = fromCharset(NUMBERS)
    if (nums) types.push(nums)
  }
  if (input.symbols) {
    const syms = fromCharset(SYMBOLS)
    if (syms) types.push(syms)
  }

  return types
}

function pickRandom(str: string): string {
  return str[randomInt(str.length)]!
}

function generateWithRepeat(charset: string, length: number): string[] {
  return Array.from({ length }, () => pickRandom(charset))
}

function applyRequireEach(chars: string[], charset: string, input: GenerateInput): string[] {
  const result = [...chars]
  const types = getActiveTypeChars(charset, input)
  const usedPositions = new Set<number>()

  for (const typeChars of types) {
    const hasType = result.some((c) => typeChars.includes(c))
    if (!hasType) {
      const available = result.map((_, i) => i).filter((i) => !usedPositions.has(i))
      if (available.length === 0) continue
      const pos = available[randomInt(available.length)]!
      result[pos] = pickRandom(typeChars)
      usedPositions.add(pos)
    }
  }

  return shuffle(result)
}

function generateNoRepeat(charset: string, input: GenerateInput): string[] {
  const { length } = input

  if (!input.requireEach) {
    return shuffle(charset.split('')).slice(0, length)
  }

  const types = getActiveTypeChars(charset, input)
  const used = new Set<string>()
  const reserved: string[] = []

  for (const typeChars of types) {
    const candidates = typeChars.split('').filter((c) => !used.has(c))
    if (candidates.length === 0) continue
    const c = candidates[randomInt(candidates.length)]!
    reserved.push(c)
    used.add(c)
  }

  const remaining = shuffle(charset.split('').filter((c) => !used.has(c)))
  const fill = remaining.slice(0, length - reserved.length)

  return shuffle([...reserved, ...fill])
}

function applySeparator(password: string, sep: { char: string; every: number }): string {
  const groups: string[] = []
  for (let i = 0; i < password.length; i += sep.every) {
    groups.push(password.slice(i, i + sep.every))
  }
  return groups.join(sep.char)
}

export async function generate(
  input: GenerateInput,
  _ctx: ToolContext
): Promise<ToolResult<{ password: string }>> {
  const charset = buildCharset(input)

  if (charset.length === 0) {
    return {
      success: false,
      error: { code: 'VALIDATION_ERROR', message: 'cmd.password.error.empty_charset' },
    }
  }

  if (input.noRepeat && input.length > charset.length) {
    return {
      success: false,
      error: {
        code: 'VALIDATION_ERROR',
        message: 'cmd.password.error.not_enough_chars',
        params: { length: input.length, size: charset.length },
      },
    }
  }

  let chars: string[]

  if (input.noRepeat) {
    chars = generateNoRepeat(charset, input)
  } else {
    chars = generateWithRepeat(charset, input.length)
    if (input.requireEach) chars = applyRequireEach(chars, charset, input)
  }

  let password = chars.join('')

  if (input.separator !== undefined) {
    password = applySeparator(password, input.separator)
  }

  const prefix = input.prefix ?? ''
  const suffix = input.suffix ?? ''
  password = prefix + password + suffix

  return { success: true, data: { password } }
}
