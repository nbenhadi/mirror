import { describe, it, expect } from 'vitest'
import { parseMarkdownAst, astToHtml } from '../engine/parse.js'
import { createGlossaryPlugin } from './glossary.js'
import type { RenderContext } from './types.js'

function buildContext(format: RenderContext['format'] = 'html'): RenderContext {
  return { sourcePath: '/doc.md', frontMatter: {}, format, state: {} }
}

async function renderWithGlossary(
  markdown: string,
  ctx: RenderContext = buildContext()
): Promise<string> {
  const tree = await parseMarkdownAst(markdown)
  await createGlossaryPlugin().transformAst?.(tree, ctx)
  return astToHtml(tree)
}

const TABLE = [
  ':::glossary',
  '| Term | Definition | Page |',
  '| --- | --- | --- |',
  '| Vault | Encrypted credential store | |',
  '| Widget | An unused term | |',
  ':::',
].join('\n')

describe('glossary plugin', () => {
  it('wraps the first occurrence of a used term in a plain span, with a hidden link nearby for pdf destinations', async () => {
    const html = await renderWithGlossary(
      `${TABLE}\n\nThe Vault keeps secrets safe.`,
      buildContext('pdf')
    )
    expect(html).toMatch(/<span id="glossary-term-vault-0"[^>]*>Vault<\/span>/)
    expect(html).toContain('href="#glossary-term-vault-0"')
  })

  it('marks the wrapped term with a themeable class and its slug', async () => {
    const html = await renderWithGlossary(
      `${TABLE}\n\nThe Vault keeps secrets safe.`,
      buildContext('pdf')
    )
    expect(html).toContain('class="glossary-term"')
    expect(html).toContain('data-term="vault"')
  })

  it('drops the themeable class and data-term when highlight is off, but still resolves the page', async () => {
    const html = await renderWithGlossary(
      ':::glossary{highlight=false}\n| Term | Definition | Page |\n| --- | --- | --- |\n| Vault | Encrypted store | |\n:::\n\nThe Vault keeps secrets safe.',
      buildContext('pdf')
    )
    expect(html).not.toContain('glossary-term"')
    expect(html).not.toContain('data-term')
    expect(html).toMatch(/<span id="glossary-term-vault-0">Vault<\/span>/)
    expect(html).toContain('href="#glossary-term-vault-0"')
  })

  it('never wraps the term itself in a link, so it is not clickable in the body', async () => {
    const html = await renderWithGlossary(
      `${TABLE}\n\nThe Vault keeps secrets safe.`,
      buildContext('pdf')
    )
    expect(html).not.toMatch(/<a[^>]*>Vault<\/a>/)
  })

  it('does not match a term inside another word', async () => {
    const html = await renderWithGlossary(
      `${TABLE}\n\nThis is about vaulting, not the term itself.`,
      buildContext('pdf')
    )
    expect(html).not.toContain('glossary-term-vault-0')
  })

  it('does not treat the term appearing in its own glossary row as a use', async () => {
    const html = await renderWithGlossary(TABLE, buildContext('pdf'))
    expect(html).not.toContain('glossary-term-')
  })

  it('preserves the original casing of the matched occurrence', async () => {
    const html = await renderWithGlossary(
      `${TABLE}\n\nWe rely on the VAULT daily.`,
      buildContext('pdf')
    )
    expect(html).toMatch(/<span id="glossary-term-vault-0"[^>]*>VAULT<\/span>/)
  })

  it('assigns sequential ids to repeated occurrences of the same term', async () => {
    const html = await renderWithGlossary(
      `${TABLE}\n\nVault is great. Vault is used twice.`,
      buildContext('pdf')
    )
    expect(html).toContain('glossary-term-vault-0')
    expect(html).toContain('glossary-term-vault-1')
  })

  it('detects the page column from the last column of a 3+ column table', async () => {
    const html = await renderWithGlossary(`${TABLE}\n\nVault appears here.`, buildContext('pdf'))
    expect(html).toMatch(/<td[^>]*>\s*<\/td>\s*<\/tr>\s*<\/tbody>/)
  })

  it('leaves the table untouched when the format is not pdf and prune is off', async () => {
    const html = await renderWithGlossary(`${TABLE}\n\nVault appears here.`, buildContext('html'))
    expect(html).toContain('Widget')
    expect(html).not.toContain('glossary-term-')
  })

  it('prunes unused terms in a single pass for non-pdf formats when prune is on', async () => {
    const html = await renderWithGlossary(
      `:::glossary{prune=true}\n| Term | Definition | Page |\n| --- | --- | --- |\n| Vault | Encrypted store | |\n| Widget | Unused | |\n:::\n\nVault appears here.`,
      buildContext('html')
    )
    expect(html).toContain('Vault')
    expect(html).not.toContain('Widget')
  })

  it('honors an explicit page column position', async () => {
    const html = await renderWithGlossary(
      [
        ':::glossary{pageColumn=2}',
        '| Term | Page | Definition |',
        '| --- | --- | --- |',
        '| Vault | | Encrypted store |',
        ':::',
        '',
        'Vault appears here.',
      ].join('\n'),
      buildContext('pdf')
    )
    expect(html).toContain('glossary-term-vault-0')
  })

  it('leaves a 2-column table unmodified when nothing needs resolving', async () => {
    const html = await renderWithGlossary(
      [':::glossary', '| Term | Definition |', '| --- | --- |', '| Vault | Store |', ':::'].join(
        '\n'
      ),
      buildContext('html')
    )
    expect(html).toContain('Vault')
    expect(html).toContain('Store')
  })
})
