import { pathToFileURL } from 'node:url'
import type { FrontMatter } from './parse.js'
import type { Margins } from '../themes/types.js'
import { PAPER_IDS, ACCENT_IDS, DEFAULT_PAPER, DEFAULT_ACCENT } from '../themes/default.js'

const RESET_CSS = `
* { box-sizing: border-box; margin: 0; padding: 0; }
body { font-family: system-ui, sans-serif; line-height: 1.5; color: #1a1a1a; }
img { max-width: 100%; }
table { border-collapse: collapse; }
`

function escapeHtml(value: string): string {
  return value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
}

function resolvePaper(value: string | undefined): string {
  return value && PAPER_IDS.includes(value) ? value : DEFAULT_PAPER
}

function resolveAccent(value: string | undefined): string {
  return value && ACCENT_IDS.includes(value) ? value : DEFAULT_ACCENT
}

function buildBaseTag(baseDir: string | undefined): string {
  if (!baseDir) return ''
  const href = pathToFileURL(baseDir).href
  return `<base href="${href.endsWith('/') ? href : `${href}/`}">`
}

export function buildHtmlDocument(
  bodyHtml: string,
  frontMatter: FrontMatter,
  themeCss?: string,
  baseDir?: string,
  format?: string,
  margins?: Margins
): string {
  const lang = frontMatter.lang ?? 'en'
  const title = frontMatter.title ?? ''
  const paper = resolvePaper(frontMatter.paper)
  const accent = resolveAccent(frontMatter.accent)
  const padding = 20

  const paddingCss =
    format !== 'pdf' && margins ? `html { padding: ${margins.y}px ${margins.x}px; }` : ''

  const headerFooterPagePadding =
    format === 'pdf' && (frontMatter.header || frontMatter.footer)
      ? `@page { ${frontMatter.header ? `padding-top: ${padding}px;` : ''} ${frontMatter.footer ? `padding-bottom: ${padding}px;` : ''} }`
      : ''

  return `<!doctype html>
<html lang="${escapeHtml(lang)}" data-paper="${paper}" data-accent="${accent}">
<head>
<meta charset="utf-8">
${buildBaseTag(baseDir)}
<title>${escapeHtml(title)}</title>
<style>${RESET_CSS}</style>
${themeCss ? `<style>${themeCss}</style>` : ''}
${paddingCss ? `<style>${paddingCss}</style>` : ''}
${headerFooterPagePadding ? `<style>${headerFooterPagePadding}</style>` : ''}
</head>
<body>
${bodyHtml}
</body>
</html>`
}
