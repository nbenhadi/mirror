import { randomInt } from 'node:crypto'
import type { ToolContext, ToolResult } from '@nbenhadi/mirror-core'
import type { PassphraseInput } from '../schema.js'
import { WORDLIST } from '../wordlist.js'

export interface PassphraseResult {
  passphrase: string
  words: number
  entropyBits: number
}

function capitalizeWord(word: string): string {
  return word.charAt(0).toUpperCase() + word.slice(1)
}

export async function passphrase(
  input: PassphraseInput,
  _ctx: ToolContext
): Promise<ToolResult<PassphraseResult>> {
  const words = Array.from({ length: input.words }, () => {
    const word = WORDLIST[randomInt(WORDLIST.length)]!
    return input.capitalize ? capitalizeWord(word) : word
  })

  if (input.number) {
    const pos = randomInt(words.length)
    words[pos] = words[pos]! + String(randomInt(10))
  }

  const passphrase = words.join(input.separator)

  let entropyBits = input.words * Math.log2(WORDLIST.length)
  if (input.number) entropyBits += Math.log2(10)

  return {
    success: true,
    data: {
      passphrase,
      words: input.words,
      entropyBits: Math.round(entropyBits),
    },
  }
}
