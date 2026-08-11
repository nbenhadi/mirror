import { describe, it, expect } from 'vitest'
import { preparePipeline, renderHtml } from './pipeline.js'

async function render(sourcePath: string, source: string) {
  const { content, plugins, renderContext } = await preparePipeline(sourcePath, source, 'html')
  const html = await renderHtml(content, plugins, renderContext)
  return { html, plugins }
}

describe('pipeline', () => {
  it('renders plain html when no plugins are listed', async () => {
    const source = '# Title\n\nHello'
    const { html, plugins } = await render('/doc/cv.md', source)
    expect(plugins).toHaveLength(0)
    expect(html).toContain('<h1 id="title">Title</h1>')
  })

  it('falls back to the bundled default theme when none is set', async () => {
    const source = '# Title\n\nHello'
    const { html } = await render('/doc/cv.md', source)
    expect(html).toContain('data-paper="white"')
    expect(html).toContain('--accent:')
  })

  it('throws for an unknown plugin id', async () => {
    const source = '---\nplugins: [does-not-exist]\n---\n\n# Title'
    await expect(render('/doc/cv.md', source)).rejects.toThrow()
  })

  it('resolves internal section links without any plugin active', async () => {
    const source = '# Title\n\nGo to [the section](#target-section).\n\n## Target section'
    const { html } = await render('/doc/cv.md', source)
    expect(html).toContain('href="#target-section"')
    expect(html).toContain('id="target-section"')
  })

  it('renders external links as clickable anchors', async () => {
    const source = '[Anthropic](https://www.anthropic.com)'
    const { html } = await render('/doc/cv.md', source)
    expect(html).toContain('<a href="https://www.anthropic.com">Anthropic</a>')
  })
})
