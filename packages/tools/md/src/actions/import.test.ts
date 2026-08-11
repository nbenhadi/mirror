import { describe, it, expect, afterEach } from 'vitest'
import { mkdtemp, mkdir, readFile, writeFile, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { buildContext } from '@nbenhadi/mirror-core'
import { importDocument } from './import.js'

const ctx = buildContext()

let dir: string

afterEach(async () => {
  if (dir) await rm(dir, { recursive: true, force: true })
})

describe('import action', () => {
  it('returns NOT_FOUND for a missing source file', async () => {
    dir = await mkdtemp(join(tmpdir(), 'mirror-md-import-'))
    const result = await importDocument({ action: 'import', path: join(dir, 'missing.html') }, ctx)
    expect(result.success).toBe(false)
    if (!result.success) expect(result.error.code).toBe('NOT_FOUND')
  })

  it('returns a validation error when the format cannot be inferred', async () => {
    dir = await mkdtemp(join(tmpdir(), 'mirror-md-import-'))
    const source = join(dir, 'doc.txt')
    await writeFile(source, 'hello')

    const result = await importDocument({ action: 'import', path: source }, ctx)

    expect(result.success).toBe(false)
    if (!result.success) expect(result.error.code).toBe('VALIDATION_ERROR')
  })

  it('converts html to markdown, inferring the format from the extension', async () => {
    dir = await mkdtemp(join(tmpdir(), 'mirror-md-import-'))
    const source = join(dir, 'doc.html')
    await writeFile(source, '<h1>Title</h1><p>Hello world</p>')

    const result = await importDocument({ action: 'import', path: source }, ctx)

    expect(result.success).toBe(true)
    if (result.success) {
      const markdown = await readFile(result.data.path, 'utf-8')
      expect(markdown).toContain('# Title')
      expect(markdown).toContain('Hello world')
    }
  })

  it('writes to a custom output path when given', async () => {
    dir = await mkdtemp(join(tmpdir(), 'mirror-md-import-'))
    const source = join(dir, 'doc.html')
    const output = join(dir, 'custom.md')
    await writeFile(source, '<p>Hi</p>')

    const result = await importDocument({ action: 'import', path: source, output }, ctx)

    expect(result.success).toBe(true)
    if (result.success) expect(result.data.path).toBe(output)
  })

  it('writes a default-named file inside the output path when it is an existing directory', async () => {
    dir = await mkdtemp(join(tmpdir(), 'mirror-md-import-'))
    const source = join(dir, 'doc.html')
    const outputDir = join(dir, 'out')
    await writeFile(source, '<p>Hi</p>')
    await mkdir(outputDir)

    const result = await importDocument({ action: 'import', path: source, output: outputDir }, ctx)

    expect(result.success).toBe(true)
    if (result.success) expect(result.data.path).toBe(join(outputDir, 'doc.md'))
  })
})
