import { describe, it, expect } from 'vitest'
import { parseMarkdownAst, astToHtml } from './parse.js'
import { assignHeadingIds, slugify } from './anchors.js'

async function renderWithAnchors(markdown: string): Promise<string> {
  const tree = await parseMarkdownAst(markdown)
  assignHeadingIds(tree)
  return astToHtml(tree)
}

describe('slugify', () => {
  it('lowercases and replaces spaces with dashes', () => {
    expect(slugify('Hello World')).toBe('hello-world')
  })

  it('strips accents', () => {
    expect(slugify('Presentacion General')).toBe('presentacion-general')
    expect(slugify('Présentation Générale')).toBe('presentation-generale')
  })

  it('trims leading and trailing dashes', () => {
    expect(slugify('  Hello!  ')).toBe('hello')
  })
})

describe('assignHeadingIds', () => {
  it('adds a slugified id to every heading', async () => {
    const html = await renderWithAnchors('# Hello World\n\n## Second Section')
    expect(html).toContain('id="hello-world"')
    expect(html).toContain('id="second-section"')
  })

  it('lets a manual internal link target a heading id', async () => {
    const markdown = 'See [details](#details).\n\n## Details'
    const html = await renderWithAnchors(markdown)
    expect(html).toContain('href="#details"')
    expect(html).toContain('id="details"')
  })

  it('honors a pandoc-style explicit id and strips it from the visible heading', async () => {
    const html = await renderWithAnchors('## Presentation du projet {#presentation-du-projet}')
    expect(html).toContain('id="presentation-du-projet"')
    expect(html).not.toContain('{#presentation-du-projet}')
    expect(html).toContain('<h2 id="presentation-du-projet">Presentation du projet</h2>')
  })

  it('falls back to slugifying when the heading has no explicit id', async () => {
    const html = await renderWithAnchors('## Just a title {.some-class}')
    expect(html).not.toContain('{.some-class}')
    expect(html).toContain('id="just-a-title"')
  })

  it('keeps a pandoc-style class attribute as a real class on the heading', async () => {
    const html = await renderWithAnchors('## Just a title {.some-class}')
    expect(html).toContain('<h2 id="just-a-title" class="some-class">Just a title</h2>')
  })

  it('combines an explicit id with a class in the same attribute block', async () => {
    const html = await renderWithAnchors('## Title {#custom-id .some-class}')
    expect(html).toContain('<h2 id="custom-id" class="some-class">Title</h2>')
  })
})
