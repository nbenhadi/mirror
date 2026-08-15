import { describe, it, expect, afterEach } from 'vitest'
import { mkdtemp, readFile, writeFile, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { buildContext } from '@nbenhadi/mirror-core'
import { exportMarkdown } from './export.js'
import { extractPageTexts } from '../engine/pdf-text.js'

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

  it('returns VALIDATION_ERROR for malformed frontmatter YAML', async () => {
    dir = await mkdtemp(join(tmpdir(), 'mirror-md-'))
    const source = join(dir, 'doc.md')
    await writeFile(source, '---\ntheme: [unclosed\n---\n\n# Hello\n')

    const result = await exportMarkdown({ action: 'export', path: source, format: 'html' }, ctx)

    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.error.code).toBe('VALIDATION_ERROR')
      expect(result.error.message).toBe('cmd.md.error.invalid_frontmatter')
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

  it('resolves real page numbers for the toc plugin through a second export pass', async () => {
    dir = await mkdtemp(join(tmpdir(), 'mirror-md-'))
    const source = join(dir, 'doc.md')
    await writeFile(
      source,
      [
        '---',
        'plugins: [toc]',
        '---',
        '::toc{pageNumbers=true}',
        '',
        '# Title',
        '',
        '## Section one',
        '',
        'content one',
        '',
        '::pagebreak',
        '',
        '## Section two',
        '',
        'content two',
      ].join('\n')
    )

    const result = await exportMarkdown({ action: 'export', path: source, format: 'pdf' }, ctx)

    expect(result.success).toBe(true)
    if (!result.success) return

    const pages = await extractPageTexts(result.data.path)
    expect(pages).toHaveLength(2)
    expect(pages[0]).toMatch(/Section two\D*2/)
    expect(pages[1]).toContain('Section two')
  }, 20000)

  it('resolves the correct page even when a heading title is also mentioned as prose earlier in the document', async () => {
    dir = await mkdtemp(join(tmpdir(), 'mirror-md-'))
    const source = join(dir, 'doc.md')
    await writeFile(
      source,
      [
        '---',
        'plugins: [toc]',
        '---',
        '::toc{pageNumbers=true}',
        '',
        '# Title',
        '',
        '## Section one',
        '',
        'this part briefly mentions Documentation technique before its real section.',
        '',
        '::pagebreak',
        '',
        '## Section two',
        '',
        'filler content',
        '',
        '::pagebreak',
        '',
        '## Documentation technique',
        '',
        'the real section content',
      ].join('\n')
    )

    const result = await exportMarkdown({ action: 'export', path: source, format: 'pdf' }, ctx)

    expect(result.success).toBe(true)
    if (!result.success) return

    const pages = await extractPageTexts(result.data.path)
    expect(pages).toHaveLength(3)
    expect(pages[0]).toMatch(/Documentation technique\D*3/)
  }, 20000)

  it('fills the glossary page column, skips excluded pages, and prunes unused terms', async () => {
    dir = await mkdtemp(join(tmpdir(), 'mirror-md-'))
    const source = join(dir, 'doc.md')
    await writeFile(
      source,
      [
        '---',
        'plugins: [glossary]',
        '---',
        ':::glossary{prune=true skipPages=2}',
        '| Term | Definition | Page |',
        '| --- | --- | --- |',
        '| Vault | Encrypted credential store | |',
        '| Ghost | Never mentioned in the document | |',
        ':::',
        '',
        '# Title',
        '',
        '::pagebreak',
        '',
        '## Section one',
        '',
        'This page briefly mentions Vault for the first time.',
        '',
        '::pagebreak',
        '',
        '## Section two',
        '',
        'Vault appears again here, on a page that is not excluded.',
        '',
        '::pagebreak',
        '',
        '## Section three',
        '',
        'filler content',
      ].join('\n')
    )

    const result = await exportMarkdown({ action: 'export', path: source, format: 'pdf' }, ctx)

    expect(result.success).toBe(true)
    if (!result.success) return

    const pages = await extractPageTexts(result.data.path)
    expect(pages).toHaveLength(4)
    expect(pages[0]).toContain('Vault')
    expect(pages[0]).not.toContain('Ghost')
    expect(pages[0]).toMatch(/Vault[^0-9]*3/)
  }, 20000)
})
