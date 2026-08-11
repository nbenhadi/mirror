import { describe, it, expect, vi } from 'vitest'

vi.mock('mammoth', () => ({
  default: {
    convertToHtml: vi.fn(async () => ({ value: '<h1>Title</h1><p>Body text</p>', messages: [] })),
  },
}))

const { convertDocxToMarkdown } = await import('./from-docx.js')

describe('convertDocxToMarkdown', () => {
  it('converts the html produced by mammoth into markdown', async () => {
    const md = await convertDocxToMarkdown('/fake/path.docx')
    expect(md).toContain('# Title')
    expect(md).toContain('Body text')
  })
})
