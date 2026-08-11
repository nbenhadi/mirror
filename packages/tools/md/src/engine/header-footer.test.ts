import { describe, it, expect, afterEach } from 'vitest'
import { mkdtemp, writeFile, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { buildHeaderFooterTemplate } from './header-footer.js'

let dir: string

afterEach(async () => {
  if (dir) await rm(dir, { recursive: true, force: true })
})

describe('buildHeaderFooterTemplate', () => {
  it('lays out left/center/right text slots', async () => {
    dir = await mkdtemp(join(tmpdir(), 'mirror-md-header-'))
    const html = await buildHeaderFooterTemplate(
      { left: 'left text', center: 'center text', right: 'right text' },
      dir
    )
    expect(html).toContain('left text')
    expect(html).toContain('center text')
    expect(html).toContain('right text')
  })

  it('replaces currentPage/totalPage tokens with playwright page-number spans', async () => {
    dir = await mkdtemp(join(tmpdir(), 'mirror-md-header-'))
    const html = await buildHeaderFooterTemplate(
      { right: 'page {{currentPage}} / {{totalPage}}' },
      dir
    )
    expect(html).toContain('<span class="pageNumber"></span>')
    expect(html).toContain('<span class="totalPages"></span>')
  })

  it('escapes text content', async () => {
    dir = await mkdtemp(join(tmpdir(), 'mirror-md-header-'))
    const html = await buildHeaderFooterTemplate({ left: '<script>alert(1)</script>' }, dir)
    expect(html).not.toContain('<script>')
    expect(html).toContain('&lt;script&gt;')
  })

  it('embeds an image slot as a base64 data uri relative to baseDir', async () => {
    dir = await mkdtemp(join(tmpdir(), 'mirror-md-header-'))
    const pngBytes = Buffer.from([0x89, 0x50, 0x4e, 0x47])
    await writeFile(join(dir, 'logo.png'), pngBytes)

    const html = await buildHeaderFooterTemplate({ left: { image: 'logo.png' } }, dir)
    expect(html).toContain(`data:image/png;base64,${pngBytes.toString('base64')}`)
  })

  it('renders an empty slot when the image file is missing', async () => {
    dir = await mkdtemp(join(tmpdir(), 'mirror-md-header-'))
    const html = await buildHeaderFooterTemplate({ left: { image: 'missing.png' } }, dir)
    expect(html).not.toContain('<img')
  })

  it('renders multiple items in a slot, in order', async () => {
    dir = await mkdtemp(join(tmpdir(), 'mirror-md-header-'))
    const pngBytes = Buffer.from([0x89, 0x50, 0x4e, 0x47])
    await writeFile(join(dir, 'logo.png'), pngBytes)

    const html = await buildHeaderFooterTemplate(
      { left: [{ image: 'logo.png' }, { text: 'Company name' }] },
      dir
    )
    const imgIndex = html.indexOf('<img')
    const textIndex = html.indexOf('Company name')
    expect(imgIndex).toBeGreaterThan(-1)
    expect(textIndex).toBeGreaterThan(imgIndex)
  })
})
