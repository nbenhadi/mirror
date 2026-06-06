import { readFile, writeFile, unlink, mkdir, chmod } from 'node:fs/promises'
import { existsSync } from 'node:fs'
import { randomBytes } from 'node:crypto'
import { homedir } from 'node:os'
import { join } from 'node:path'
import { encryptBuffer, decryptBuffer } from './crypto.js'
import type { SessionData } from './types.js'

const SESSION_DIR = join(homedir(), '.local', 'share', 'mirror')
const SESSION_FILE = join(SESSION_DIR, 'vault.session')
const SESSION_KEY_FILE = join(homedir(), '.config', 'mirror', 'session.key')

async function getOrCreateSessionKey(): Promise<Buffer> {
  if (existsSync(SESSION_KEY_FILE)) {
    const raw = await readFile(SESSION_KEY_FILE, 'utf8')
    return Buffer.from(raw.trim(), 'base64')
  }
  const key = randomBytes(32)
  const dir = join(homedir(), '.config', 'mirror')
  if (!existsSync(dir)) await mkdir(dir, { recursive: true })
  await writeFile(SESSION_KEY_FILE, key.toString('base64'), { encoding: 'utf8', mode: 0o600 })
  return key
}

export async function loadSession(): Promise<SessionData | null> {
  if (!existsSync(SESSION_FILE)) return null
  try {
    const sessionKey = await getOrCreateSessionKey()
    const raw = await readFile(SESSION_FILE)
    const decrypted = decryptBuffer(raw, sessionKey)
    const data = JSON.parse(decrypted) as SessionData
    if (Date.now() > data.expiry) {
      await clearSession()
      return null
    }
    return data
  } catch {
    await clearSession()
    return null
  }
}

export async function saveSession(data: SessionData): Promise<void> {
  if (!existsSync(SESSION_DIR)) {
    await mkdir(SESSION_DIR, { recursive: true })
  }
  const sessionKey = await getOrCreateSessionKey()
  const encrypted = encryptBuffer(JSON.stringify(data), sessionKey)
  await writeFile(SESSION_FILE, encrypted, { mode: 0o600 })
  await chmod(SESSION_FILE, 0o600)
}

export async function clearSession(): Promise<void> {
  if (existsSync(SESSION_FILE)) {
    await unlink(SESSION_FILE)
  }
}
