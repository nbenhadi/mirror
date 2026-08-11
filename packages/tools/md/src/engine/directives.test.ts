import { describe, it, expect } from 'vitest'
import { markdownToHtmlBody } from './parse.js'

describe('directives', () => {
  it('converts a container directive into a div with the directive name as class', async () => {
    const html = await markdownToHtmlBody(':::row\ncontent\n:::')
    expect(html).toContain('<div class="row">')
    expect(html).toContain('content')
  })

  it('merges shorthand classes from directive attributes', async () => {
    const html = await markdownToHtmlBody(':::col{.span-2}\ncontent\n:::')
    expect(html).toContain('<div class="col span-2">')
  })

  it('nests container directives', async () => {
    const html = await markdownToHtmlBody(':::row\n:::col\ninner\n:::\n:::')
    expect(html).toContain('<div class="row">')
    expect(html).toContain('<div class="col">')
    expect(html).toContain('inner')
  })

  it('converts a text directive into a span with the directive name as class', async () => {
    const html = await markdownToHtmlBody('### Title :date[Sept 2025 - Present]')
    expect(html).toContain('<span class="date">Sept 2025 - Present</span>')
  })

  it('prefixes non-class attributes with data- to avoid unsafe attribute injection', async () => {
    const html = await markdownToHtmlBody('::leaf{onclick="alert(1)"}')
    expect(html).not.toMatch(/[^-]onclick=/)
    expect(html).toContain('data-onclick="alert(1)"')
  })

  it('renders id attribute as a real id', async () => {
    const html = await markdownToHtmlBody(':::row{#main}\ncontent\n:::')
    expect(html).toContain('id="main"')
  })

  it('keeps an outer container open across multiple same-level nested containers when it uses more colons', async () => {
    const html = await markdownToHtmlBody(
      '::::row\n:::col\nfirst\n:::\n\n:::col\nsecond\n:::\n::::'
    )
    expect(html).toBe(
      '<div class="row"><div class="col"><p>first</p></div><div class="col"><p>second</p></div></div>'
    )
  })
})
