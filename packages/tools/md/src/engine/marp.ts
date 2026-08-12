import matter from 'gray-matter'
import { Marp } from '@marp-team/marp-core'
import { buildBaseTag } from './html.js'

export interface SlidesRenderResult {
  html: string
  css: string
}

export interface ParsedSlides {
  data: Record<string, unknown>
  content: string
}

export function parseSlidesSource(source: string): ParsedSlides {
  return matter(source)
}

export function resolveSlidesTheme(
  parsed: ParsedSlides,
  themeOverride: string | undefined
): string | undefined {
  if (themeOverride) return themeOverride
  return typeof parsed.data['theme'] === 'string' ? parsed.data['theme'] : undefined
}

export function renderSlides(
  parsed: ParsedSlides,
  themeOverride: string | undefined,
  themeCss: string | undefined
): SlidesRenderResult {
  const data = themeOverride ? { ...parsed.data, theme: themeOverride } : parsed.data

  const marp = new Marp({ html: true })
  if (themeCss) marp.themeSet.add(themeCss)

  const { html, css } = marp.render(matter.stringify(parsed.content, data))
  return { html, css }
}

export function buildSlidesHtmlDocument(html: string, css: string, baseDir?: string): string {
  return `<!doctype html>
<html>
<head>
<meta charset="utf-8">
${buildBaseTag(baseDir)}
<style>
${css}
</style>
</head>
<body>
${html}
</body>
</html>
`
}
