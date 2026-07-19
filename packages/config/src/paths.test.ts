import { describe, it, expect, vi, afterEach } from 'vitest'

vi.mock('node:os', async (importOriginal) => {
  const actual = await importOriginal<typeof import('node:os')>()
  return { ...actual, platform: vi.fn(() => actual.platform()) }
})

import { platform } from 'node:os'
import { getConfigDir, getUserDataDir, getConfigPath } from './paths.js'

const mockPlatform = vi.mocked(platform)
const origXdg = process.env['XDG_CONFIG_HOME']

afterEach(() => {
  if (origXdg === undefined) {
    delete process.env['XDG_CONFIG_HOME']
  } else {
    process.env['XDG_CONFIG_HOME'] = origXdg
  }
  vi.clearAllMocks()
})

describe('getConfigDir', () => {
  it('uses XDG_CONFIG_HOME when set', () => {
    process.env['XDG_CONFIG_HOME'] = '/custom/xdg'
    expect(getConfigDir()).toBe('/custom/xdg/mirror')
  })

  it('ignores blank XDG_CONFIG_HOME and falls through to platform', () => {
    process.env['XDG_CONFIG_HOME'] = '  '
    mockPlatform.mockReturnValue('linux')
    expect(getConfigDir()).toContain('.config/mirror')
  })

  it('returns macOS path on darwin', () => {
    delete process.env['XDG_CONFIG_HOME']
    mockPlatform.mockReturnValue('darwin')
    expect(getConfigDir()).toContain('Library/Application Support/mirror')
  })

  it('returns linux path on linux', () => {
    delete process.env['XDG_CONFIG_HOME']
    mockPlatform.mockReturnValue('linux')
    expect(getConfigDir()).toContain('.config/mirror')
  })

  it('returns win32 path on win32', () => {
    delete process.env['XDG_CONFIG_HOME']
    mockPlatform.mockReturnValue('win32')
    expect(getConfigDir()).toContain('mirror')
  })
})

describe('getUserDataDir', () => {
  it('returns linux data dir', () => {
    mockPlatform.mockReturnValue('linux')
    expect(getUserDataDir()).toContain('.local/share/mirror')
  })

  it('returns macOS data dir on darwin', () => {
    mockPlatform.mockReturnValue('darwin')
    expect(getUserDataDir()).toContain('Library/Application Support/mirror')
  })

  it('returns win32 data dir on win32', () => {
    mockPlatform.mockReturnValue('win32')
    expect(getUserDataDir()).toContain('AppData/Local/mirror')
  })
})

describe('getConfigPath', () => {
  it('ends with config.json under XDG dir', () => {
    process.env['XDG_CONFIG_HOME'] = '/tmp/test-xdg'
    expect(getConfigPath()).toBe('/tmp/test-xdg/mirror/config.json')
  })
})
