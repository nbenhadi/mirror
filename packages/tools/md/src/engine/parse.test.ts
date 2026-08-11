import { describe, it, expect } from 'vitest'
import { parseFrontMatter, markdownToHtmlBody } from './parse.js'

describe('parseFrontMatter', () => {
  it('extracts known frontmatter fields', () => {
    const source = '---\ntitle: CV\nauthor: Nourddin\nlang: fr\n---\n\n# Hello'
    const { frontMatter, content } = parseFrontMatter(source)
    expect(frontMatter.title).toBe('CV')
    expect(frontMatter.author).toBe('Nourddin')
    expect(frontMatter.lang).toBe('fr')
    expect(content.trim()).toBe('# Hello')
  })

  it('returns an empty frontmatter object when there is none', () => {
    const { frontMatter, content } = parseFrontMatter('# Hello')
    expect(frontMatter).toEqual({})
    expect(content.trim()).toBe('# Hello')
  })

  it('ignores non-string, non-object plugin entries', () => {
    const source = '---\nplugins:\n  - toc\n  - 5\n---\nbody'
    const { frontMatter } = parseFrontMatter(source)
    expect(frontMatter.plugins).toBeUndefined()
  })

  it('accepts plugin entries with config objects', () => {
    const source = '---\nplugins:\n  - toc\n  - id: glossary\n    fromPage: 2\n---\nbody'
    const { frontMatter } = parseFrontMatter(source)
    expect(frontMatter.plugins).toEqual(['toc', { id: 'glossary', fromPage: 2 }])
  })

  it('parses header/footer slots with text and image content', () => {
    const source = [
      '---',
      'header:',
      '  left:',
      '    image: assets/logo.png',
      '  center: "{{currentPage}} / {{totalPage}}"',
      'footer:',
      '  right: confidential',
      '---',
      'body',
    ].join('\n')
    const { frontMatter } = parseFrontMatter(source)
    expect(frontMatter.header).toEqual({
      left: { image: 'assets/logo.png' },
      center: '{{currentPage}} / {{totalPage}}',
    })
    expect(frontMatter.footer).toEqual({ right: 'confidential' })
  })

  it('parses a header slot with multiple items in order', () => {
    const source = [
      '---',
      'header:',
      '  left:',
      '    - image: assets/logo.png',
      '    - text: Company name',
      '---',
      'body',
    ].join('\n')
    const { frontMatter } = parseFrontMatter(source)
    expect(frontMatter.header).toEqual({
      left: [{ image: 'assets/logo.png' }, { text: 'Company name' }],
    })
  })

  it('extracts paper and accent', () => {
    const source = '---\npaper: cream\naccent: rust\n---\nbody'
    const { frontMatter } = parseFrontMatter(source)
    expect(frontMatter.paper).toBe('cream')
    expect(frontMatter.accent).toBe('rust')
  })

  it('ignores a header/footer slot without a string or image value', () => {
    const source = '---\nheader:\n  left: 5\n---\nbody'
    const { frontMatter } = parseFrontMatter(source)
    expect(frontMatter.header).toBeUndefined()
  })
})

describe('markdownToHtmlBody', () => {
  it('converts headings and lists to html', async () => {
    const html = await markdownToHtmlBody('# Title\n\n- one\n- two')
    expect(html).toContain('<h1>Title</h1>')
    expect(html).toContain('<li>one</li>')
    expect(html).toContain('<li>two</li>')
  })

  it('supports gfm tables', async () => {
    const html = await markdownToHtmlBody('| A | B |\n| --- | --- |\n| 1 | 2 |')
    expect(html).toContain('<table>')
  })
})
