import { describe, it, expect } from 'vitest'
import { convertHtmlToMarkdown } from './from-html.js'

describe('convertHtmlToMarkdown', () => {
  it('converts headings and paragraphs', () => {
    const md = convertHtmlToMarkdown('<h1>Title</h1><p>Hello <strong>world</strong></p>')
    expect(md).toContain('# Title')
    expect(md).toContain('**world**')
  })

  it('converts lists', () => {
    const md = convertHtmlToMarkdown('<ul><li>one</li><li>two</li></ul>')
    expect(md).toMatch(/^-\s+one$/m)
    expect(md).toMatch(/^-\s+two$/m)
  })

  it('converts links', () => {
    const md = convertHtmlToMarkdown('<a href="https://example.com">link</a>')
    expect(md).toContain('[link](https://example.com)')
  })

  it('strips style and script content instead of leaking it as text', () => {
    const html =
      '<html><head><style>body{color:red}</style><script>alert(1)</script></head>' +
      '<body><h1>Title</h1></body></html>'
    const md = convertHtmlToMarkdown(html)
    expect(md.trim()).toBe('# Title')
  })

  it('strips the document title instead of leaking it above the content', () => {
    const html = '<html><head><title>Page Title</title></head><body><h1>Content</h1></body></html>'
    const md = convertHtmlToMarkdown(html)
    expect(md.trim()).toBe('# Content')
  })
})
