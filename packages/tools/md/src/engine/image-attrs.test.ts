import { describe, it, expect } from 'vitest'
import { parseMarkdownAst, astToHtml } from './parse.js'
import { assignImageAttrs } from './image-attrs.js'

async function renderWithImageAttrs(markdown: string): Promise<string> {
  const tree = await parseMarkdownAst(markdown)
  assignImageAttrs(tree)
  return astToHtml(tree)
}

describe('assignImageAttrs', () => {
  it('turns a trailing {width=... height=...} block into an inline style', async () => {
    const html = await renderWithImageAttrs('![alt](pic.png){width=300px height=200px}')
    expect(html).toContain('style="width:300px;height:200px"')
    expect(html).not.toContain('{width=300px height=200px}')
  })

  it('treats a bare number as pixels', async () => {
    const html = await renderWithImageAttrs('![alt](pic.png){width=300}')
    expect(html).toContain('style="width:300px"')
  })

  it('keeps trailing text after the attribute block', async () => {
    const html = await renderWithImageAttrs('![alt](pic.png){width=300px} caption text')
    expect(html).toContain('style="width:300px"')
    expect(html).toContain('caption text')
  })

  it('leaves images without a trailing attribute block untouched', async () => {
    const html = await renderWithImageAttrs('![alt](pic.png)')
    expect(html).not.toContain('style=')
  })

  it('leaves plain text starting with a brace alone', async () => {
    const html = await renderWithImageAttrs('![alt](pic.png)\n\n{not attributes}')
    expect(html).not.toContain('style=')
    expect(html).toContain('{not attributes}')
  })

  it('accepts semicolons between entries', async () => {
    const html = await renderWithImageAttrs('![alt](pic.png){height=320px; width=auto}')
    expect(html).toContain('style="height:320px;width:auto"')
  })

  it('passes through arbitrary css properties, not just width/height', async () => {
    const html = await renderWithImageAttrs('![alt](pic.png){display=block margin="1em auto"}')
    expect(html).toContain('style="display:block;margin:1em auto"')
  })
})
