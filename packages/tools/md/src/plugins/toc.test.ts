import { describe, it, expect } from 'vitest'
import { parseMarkdownAst, astToHtml } from '../engine/parse.js'
import { assignHeadingIds } from '../engine/anchors.js'
import { createTocPlugin } from './toc.js'
import type { RenderContext } from './types.js'

function buildContext(format: RenderContext['format'] = 'html'): RenderContext {
  return { sourcePath: '/doc.md', frontMatter: {}, format, state: {} }
}

async function renderWithToc(
  markdown: string,
  ctx: RenderContext = buildContext()
): Promise<string> {
  const tree = await parseMarkdownAst(markdown)
  assignHeadingIds(tree)
  await createTocPlugin().transformAst?.(tree, ctx)
  return astToHtml(tree)
}

describe('toc plugin', () => {
  it('replaces the ::toc directive with a nav listing the headings', async () => {
    const html = await renderWithToc('::toc\n\n# Title\n\n## Section one\n\n## Section two')
    expect(html).toContain('<nav class="toc">')
    expect(html).toContain('<a class="toc-link" href="#section-one">')
    expect(html).toContain('<span class="toc-title">Section one</span>')
    expect(html).toContain('<a class="toc-link" href="#section-two">')
  })

  it('excludes the h1 by default and includes h2/h3', async () => {
    const html = await renderWithToc(
      '::toc\n\n# Title\n\n## Section\n\n### Subsection\n\n#### Detail'
    )
    expect(html).not.toContain('href="#title"')
    expect(html).toContain('href="#section"')
    expect(html).toContain('href="#subsection"')
    expect(html).not.toContain('href="#detail"')
  })

  it('honors minDepth/maxDepth set on the directive itself', async () => {
    const html = await renderWithToc(
      '::toc{minDepth=1 maxDepth=1}\n\n# Title\n\n## Section\n\n### Subsection'
    )
    expect(html).toContain('href="#title"')
    expect(html).not.toContain('href="#section"')
  })

  it('lets each ::toc placement have its own depth range', async () => {
    const html = await renderWithToc(
      '::toc{minDepth=1 maxDepth=1}\n\n::toc{minDepth=2 maxDepth=2}\n\n# Title\n\n## Section'
    )
    const [first, second] = html.split('</nav>')
    expect(first).toContain('href="#title"')
    expect(first).not.toContain('href="#section"')
    expect(second).toContain('href="#section"')
    expect(second).not.toContain('href="#title"')
  })

  it('indents entries relative to minDepth via a css custom property', async () => {
    const html = await renderWithToc('::toc\n\n# Title\n\n## Section\n\n### Subsection')
    expect(html).toContain('style="--toc-level: 0"')
    expect(html).toContain('style="--toc-level: 1"')
  })

  it('picks up headings regardless of where the directive sits in the document', async () => {
    const html = await renderWithToc('# Title\n\n## Section\n\n::toc')
    expect(html).toContain('href="#section"')
  })

  it('supports more than one ::toc placement in the same document', async () => {
    const html = await renderWithToc('::toc\n\n# Title\n\n## Section\n\n::toc')
    expect(html.match(/<nav class="toc">/g)).toHaveLength(2)
  })

  it('omits the page number span when pageNumbers is not requested', async () => {
    const html = await renderWithToc('::toc\n\n# Title\n\n## Section', buildContext('pdf'))
    expect(html).not.toContain('toc-page')
  })

  it('renders an empty page number span on the first pdf pass, before page numbers are known', async () => {
    const html = await renderWithToc(
      '::toc{pageNumbers=true}\n\n# Title\n\n## Section',
      buildContext('pdf')
    )
    expect(html).toContain('<span class="toc-page"></span>')
  })

  it('fills in real page numbers once they are stored on the render state', async () => {
    const ctx = buildContext('pdf')
    ctx.state['tocPages'] = { section: 3 }
    const html = await renderWithToc('::toc{pageNumbers=true}\n\n# Title\n\n## Section', ctx)
    expect(html).toContain('<span class="toc-page">3</span>')
  })

  it('ignores pageNumbers for non-pdf formats', async () => {
    const html = await renderWithToc(
      '::toc{pageNumbers=true}\n\n# Title\n\n## Section',
      buildContext('html')
    )
    expect(html).not.toContain('toc-page')
  })

  it('excludes a heading marked with {.no-toc}', async () => {
    const html = await renderWithToc(
      '::toc\n\n# Title\n\n## Table des matieres {.no-toc}\n\n## Section'
    )
    expect(html).not.toContain('href="#table-des-matieres"')
    expect(html).toContain('href="#section"')
  })
})
