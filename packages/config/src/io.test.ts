import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { mkdtemp, rm, writeFile, mkdir, stat } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { readConfig, patchConfig } from './io.js'
import { readConfigSync } from './sync.js'
import { getConfigPath } from './paths.js'

let home: string
const env = { ...process.env }

beforeEach(async () => {
  home = await mkdtemp(join(tmpdir(), 'mirror-config-'))
  process.env['HOME'] = home
  process.env['XDG_CONFIG_HOME'] = join(home, '.config')
})

afterEach(async () => {
  process.env['HOME'] = env['HOME']
  process.env['XDG_CONFIG_HOME'] = env['XDG_CONFIG_HOME']
  await rm(home, { recursive: true, force: true })
})

async function writeConfigFile(data: unknown): Promise<void> {
  const path = getConfigPath()
  await mkdir(join(home, '.config', 'mirror'), { recursive: true })
  await writeFile(path, JSON.stringify(data))
}

describe('readConfig', () => {
  it('returns {} when no file exists', async () => {
    expect(await readConfig()).toEqual({})
  })

  it('reads and validates existing config', async () => {
    await writeConfigFile({ version: 1, general: { lang: 'es' } })
    const cfg = await readConfig()
    expect(cfg.general?.lang).toBe('es')
  })

  it('keeps data best-effort when validation fails', async () => {
    await writeConfigFile({ version: 1, general: { lang: 'es' }, tools: { vault: { path: 1 } } })
    const cfg = await readConfig()
    expect(cfg.general?.lang).toBe('es')
  })
})

describe('patchConfig', () => {
  it('creates the file with version stamped', async () => {
    await patchConfig({ general: { lang: 'fr' } })
    const cfg = await readConfig()
    expect(cfg).toMatchObject({ version: 1, general: { lang: 'fr' } })
  })

  it('deep-merges without dropping the vault salt', async () => {
    await writeConfigFile({
      version: 1,
      tools: {
        vault: { path: '/v', salt: 'abc', kdf: { memoryCost: 1, timeCost: 1, parallelism: 1 } },
      },
    })
    await patchConfig({ general: { lang: 'es' } })
    const cfg = await readConfig()
    expect(cfg.general?.lang).toBe('es')
    expect(cfg.tools?.vault?.salt).toBe('abc')
  })

  it('writes the file with 0600 permissions', async () => {
    await patchConfig({ general: { lang: 'en' } })
    const mode = (await stat(getConfigPath())).mode & 0o777
    expect(mode).toBe(0o600)
  })
})

describe('readConfigSync', () => {
  it('returns {} when no file exists', () => {
    expect(readConfigSync()).toEqual({})
  })

  it('reads existing config synchronously', async () => {
    await patchConfig({ general: { lang: 'fr' } })
    const cfg = readConfigSync()
    expect(cfg.general?.lang).toBe('fr')
  })

  it('returns best-effort on invalid schema', async () => {
    await writeConfigFile({ version: 1, general: { lang: 'es' } })
    const cfg = readConfigSync()
    expect(cfg.general?.lang).toBe('es')
  })

  it('returns {} when file contains corrupt JSON', async () => {
    const path = getConfigPath()
    await mkdir(join(home, '.config', 'mirror'), { recursive: true })
    await writeFile(path, '{corrupt json:::')
    expect(readConfigSync()).toEqual({})
  })
})
