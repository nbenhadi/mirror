import { describe, it, expect, afterEach } from 'vitest'
import { mkdtemp, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { buildHtmlDocument } from '../html.js'
import { exportDocument } from '../export-pdf.js'
import { convertPdfToMarkdown } from './from-pdf.js'

let dir: string

afterEach(async () => {
  if (dir) await rm(dir, { recursive: true, force: true })
})

describe('convertPdfToMarkdown', () => {
  it('extracts text and guesses a heading from a larger font size', async () => {
    dir = await mkdtemp(join(tmpdir(), 'mirror-md-pdf-'))
    const pdfPath = join(dir, 'doc.pdf')

    const body = Array.from(
      { length: 6 },
      (_, i) => `<p style="font-size: 12px">Paragraph number ${i}.</p>`
    ).join('')
    const html = buildHtmlDocument(`<h1 style="font-size: 32px">Big Title</h1>${body}`, {})
    await exportDocument(html, { format: 'pdf', outputPath: pdfPath })

    const markdown = await convertPdfToMarkdown(pdfPath)

    expect(markdown).toMatch(/^#+ Big Title/m)
    expect(markdown).toContain('Paragraph number 0.')
  }, 20000)
})
