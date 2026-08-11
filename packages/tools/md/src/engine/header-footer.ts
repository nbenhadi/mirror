import { readFile } from 'node:fs/promises'
import { extname, isAbsolute, resolve } from 'node:path'
import type { HeaderFooterConfig, HeaderFooterItem, HeaderFooterSlotContent } from './parse.js'
import type { Margins } from '../themes/types.js'

const IMAGE_MIME_TYPES: Record<string, string> = {
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.svg': 'image/svg+xml',
  '.webp': 'image/webp',
}

const HEADER_FOOTER_IMAGE_HEIGHT_PX = 20

function escapeHtml(value: string): string {
  return value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
}

function replacePageTokens(text: string): string {
  return escapeHtml(text)
    .replace(/\{\{\s*currentPage\s*\}\}/g, '<span class="pageNumber"></span>')
    .replace(/\{\{\s*totalPage\s*\}\}/g, '<span class="totalPages"></span>')
}

async function renderItem(item: HeaderFooterItem, baseDir: string): Promise<string> {
  if (typeof item === 'string') return replacePageTokens(item)
  if ('text' in item) return replacePageTokens(item.text)

  const mimeType = IMAGE_MIME_TYPES[extname(item.image).toLowerCase()]
  if (!mimeType) return ''

  const imagePath = isAbsolute(item.image) ? item.image : resolve(baseDir, item.image)
  try {
    const data = await readFile(imagePath)
    return `<img src="data:${mimeType};base64,${data.toString('base64')}" style="height:${HEADER_FOOTER_IMAGE_HEIGHT_PX}px; vertical-align:middle;">`
  } catch {
    return ''
  }
}

async function renderSlot(
  content: HeaderFooterSlotContent | undefined,
  baseDir: string
): Promise<string> {
  if (!content) return ''
  const items = Array.isArray(content) ? content : [content]
  const rendered = await Promise.all(items.map((item) => renderItem(item, baseDir)))
  return rendered.filter(Boolean).join(' ')
}

export interface HeaderFooterStyle {
  paperColor?: string
  textColor?: string
  fontFamily?: string
  fontSizePx?: number
  margins?: Margins
}

export async function buildHeaderFooterTemplate(
  config: HeaderFooterConfig,
  baseDir: string,
  style: HeaderFooterStyle = {}
): Promise<string> {
  const [left, center, right] = await Promise.all([
    renderSlot(config.left, baseDir),
    renderSlot(config.center, baseDir),
    renderSlot(config.right, baseDir),
  ])

  const background = 'transparent'
  const color = style.textColor ?? '#666'
  const fontFamily = style.fontFamily ?? 'sans-serif'
  const fontSize = style.fontSizePx ?? 10
  const marginX = style.margins?.x ?? 37.8
  const marginY = 0

  return `<div style="width:100%; height:100%; box-sizing:border-box; font-size:${fontSize}px; font-family:${fontFamily}; color:${color}; background:${background}; padding:${marginY}px ${marginX}px; display:grid; grid-template-columns: 1fr auto 1fr; column-gap: 1em; align-items:center; white-space:nowrap;">
<div style="text-align:left; overflow:hidden; text-overflow:ellipsis;">${left}</div>
<div style="text-align:center;">${center}</div>
<div style="text-align:right; overflow:hidden; text-overflow:ellipsis;">${right}</div>
</div>`
}
