import { describe, it, expect } from 'vitest'
import { buildHtmlDocument } from './html.js'

describe('buildHtmlDocument', () => {
  it('wraps body html with lang and title from frontmatter', () => {
    const html = buildHtmlDocument('<h1>Hi</h1>', { title: 'CV', lang: 'fr' })
    expect(html).toContain('lang="fr"')
    expect(html).toContain('<title>CV</title>')
    expect(html).toContain('<h1>Hi</h1>')
  })

  it('falls back to english and an empty title', () => {
    const html = buildHtmlDocument('<p>Body</p>', {})
    expect(html).toContain('lang="en"')
    expect(html).toContain('<title></title>')
  })

  it('escapes the title', () => {
    const html = buildHtmlDocument('<p>Body</p>', { title: '<script>' })
    expect(html).not.toContain('<title><script>')
    expect(html).toContain('&lt;script&gt;')
  })

  it('defaults paper and accent when not set', () => {
    const html = buildHtmlDocument('<p>Body</p>', {})
    expect(html).toContain('data-paper="white"')
    expect(html).toContain('data-accent="indigo"')
  })

  it('honors a valid paper and accent from frontmatter', () => {
    const html = buildHtmlDocument('<p>Body</p>', { paper: 'cream', accent: 'rust' })
    expect(html).toContain('data-paper="cream"')
    expect(html).toContain('data-accent="rust"')
  })

  it('falls back to defaults for an unknown paper or accent', () => {
    const html = buildHtmlDocument('<p>Body</p>', { paper: 'neon', accent: 'lava' })
    expect(html).toContain('data-paper="white"')
    expect(html).toContain('data-accent="indigo"')
  })
})
