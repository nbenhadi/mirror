import { describe, it, expect, afterEach } from 'vitest'
import { mkdtemp, readFile, writeFile, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { buildContext } from '@nbenhadi/mirror-core'
import { exportMarkdown } from './export.js'

const ctx = buildContext()

let dir: string

afterEach(async () => {
  if (dir) await rm(dir, { recursive: true, force: true })
})

describe('export action', () => {
  it('returns NOT_FOUND for a missing source file', async () => {
    dir = await mkdtemp(join(tmpdir(), 'mirror-md-'))
    const result = await exportMarkdown(
      { action: 'export', path: join(dir, 'missing.md'), format: 'html' },
      ctx
    )
    expect(result.success).toBe(false)
    if (!result.success) expect(result.error.code).toBe('NOT_FOUND')
  })

  it('renders markdown to an html file', async () => {
    dir = await mkdtemp(join(tmpdir(), 'mirror-md-'))
    const source = join(dir, 'doc.md')
    await writeFile(source, '# Hello\n\nworld')

    const result = await exportMarkdown({ action: 'export', path: source, format: 'html' }, ctx)

    expect(result.success).toBe(true)
    if (result.success) {
      const html = await readFile(result.data.path, 'utf-8')
      expect(html).toContain('<h1 id="hello">Hello</h1>')
    }
  })

  it('returns VALIDATION_ERROR when a plugin path does not export a valid plugin', async () => {
    dir = await mkdtemp(join(tmpdir(), 'mirror-md-'))
    const badPlugin = join(dir, 'bad-plugin.mjs')
    await writeFile(badPlugin, 'export default {}\n')
    const source = join(dir, 'doc.md')
    await writeFile(source, '---\nplugins: ["./bad-plugin.mjs"]\n---\n# Hello\n')

    const result = await exportMarkdown({ action: 'export', path: source, format: 'html' }, ctx)

    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.error.code).toBe('VALIDATION_ERROR')
      expect(result.error.message).toBe('cmd.md.export.error.invalid_plugin')
    }
  })

  it('returns VALIDATION_ERROR when pages requests a page the document does not have', async () => {
    dir = await mkdtemp(join(tmpdir(), 'mirror-md-'))
    const source = join(dir, 'doc.md')
    await writeFile(source, '# Hello\n\nworld')

    const result = await exportMarkdown(
      { action: 'export', path: source, format: 'pdf', pages: '5' },
      ctx
    )

    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.error.code).toBe('VALIDATION_ERROR')
      expect(result.error.message).toBe('cmd.md.export.error.invalid_page_range')
    }
  }, 15000)
})
