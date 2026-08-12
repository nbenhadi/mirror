import { describe, it, expect, afterEach } from 'vitest'
import { mkdtemp, readFile, writeFile, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { pathToFileURL } from 'node:url'
import { buildContext } from '@nbenhadi/mirror-core'
import { slides } from './slides.js'

const ctx = buildContext()

let dir: string

afterEach(async () => {
  if (dir) await rm(dir, { recursive: true, force: true })
})

describe('slides action', () => {
  it('returns NOT_FOUND for a missing source file', async () => {
    dir = await mkdtemp(join(tmpdir(), 'mirror-md-slides-'))
    const result = await slides(
      { action: 'slides', path: join(dir, 'missing.md'), format: 'html' },
      ctx
    )
    expect(result.success).toBe(false)
    if (!result.success) expect(result.error.code).toBe('NOT_FOUND')
  })

  it('renders a slide deck to html using a bundled marp theme', async () => {
    dir = await mkdtemp(join(tmpdir(), 'mirror-md-slides-'))
    const source = join(dir, 'deck.md')
    await writeFile(source, '---\ntheme: gaia\n---\n\n# Slide one\n\n---\n\n# Slide two\n')

    const result = await slides({ action: 'slides', path: source, format: 'html' }, ctx)

    expect(result.success).toBe(true)
    if (result.success) {
      const html = await readFile(result.data.path, 'utf-8')
      expect(html).toContain('Slide one')
      expect(html).toContain('Slide two')
    }
  })

  it('resolves relative images regardless of where the html output ends up', async () => {
    dir = await mkdtemp(join(tmpdir(), 'mirror-md-slides-'))
    const source = join(dir, 'deck.md')
    await writeFile(source, '![](assets/dot.png)\n')
    const outDir = await mkdtemp(join(tmpdir(), 'mirror-md-slides-out-'))
    const output = join(outDir, 'deck.html')

    const result = await slides({ action: 'slides', path: source, format: 'html', output }, ctx)

    expect(result.success).toBe(true)
    if (result.success) {
      const html = await readFile(result.data.path, 'utf-8')
      const expectedHref = pathToFileURL(dir).href
      expect(html).toContain(
        `<base href="${expectedHref.endsWith('/') ? expectedHref : `${expectedHref}/`}">`
      )
    }

    await rm(outDir, { recursive: true, force: true })
  })

  it('returns VALIDATION_ERROR for malformed frontmatter YAML', async () => {
    dir = await mkdtemp(join(tmpdir(), 'mirror-md-slides-'))
    const source = join(dir, 'deck.md')
    await writeFile(source, '---\ntheme: [unclosed\n---\n\n# Slide one\n')

    const result = await slides({ action: 'slides', path: source, format: 'html' }, ctx)

    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.error.code).toBe('VALIDATION_ERROR')
      expect(result.error.message).toBe('cmd.md.error.invalid_frontmatter')
    }
  })

  it('returns VALIDATION_ERROR for a theme that does not exist', async () => {
    dir = await mkdtemp(join(tmpdir(), 'mirror-md-slides-'))
    const source = join(dir, 'deck.md')
    await writeFile(source, '# Slide one\n')

    const result = await slides(
      { action: 'slides', path: source, format: 'html', theme: 'does-not-exist' },
      ctx
    )

    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.error.code).toBe('VALIDATION_ERROR')
      expect(result.error.message).toBe('cmd.md.slides.error.theme_not_found')
    }
  })

  it('exports a slide deck to pdf', async () => {
    dir = await mkdtemp(join(tmpdir(), 'mirror-md-slides-'))
    const source = join(dir, 'deck.md')
    await writeFile(source, '# Slide one\n\n---\n\n# Slide two\n')

    const result = await slides({ action: 'slides', path: source, format: 'pdf' }, ctx)

    expect(result.success).toBe(true)
    if (result.success) {
      const pdf = await readFile(result.data.path)
      expect(pdf.subarray(0, 4).toString()).toBe('%PDF')
    }
  }, 15000)
})
