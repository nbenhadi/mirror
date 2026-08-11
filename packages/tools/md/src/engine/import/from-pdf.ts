import { readFile } from 'node:fs/promises'
import { getDocument } from 'pdfjs-dist/legacy/build/pdf.mjs'

const LINE_EPSILON = 2
const HEADING_1_RATIO = 1.6
const HEADING_2_RATIO = 1.2

interface Line {
  text: string
  fontSize: number
}

async function extractLines(pdfPath: string): Promise<Line[][]> {
  const data = await readFile(pdfPath)
  const doc = await getDocument({ data: new Uint8Array(data) }).promise
  const pages: Line[][] = []

  for (let i = 1; i <= doc.numPages; i++) {
    const page = await doc.getPage(i)
    const content = await page.getTextContent()

    const lines: Line[] = []
    let currentY: number | undefined
    let currentTexts: string[] = []
    let currentFontSize = 0

    for (const item of content.items) {
      if (!('str' in item) || item.str.trim() === '') continue

      const y = item.transform[5] as number
      const fontSize = Math.abs(item.transform[3] as number)

      if (currentY === undefined || Math.abs(y - currentY) > LINE_EPSILON) {
        if (currentTexts.length > 0) {
          lines.push({ text: currentTexts.join(' ').trim(), fontSize: currentFontSize })
        }
        currentY = y
        currentTexts = [item.str]
        currentFontSize = fontSize
      } else {
        currentTexts.push(item.str)
        currentFontSize = Math.max(currentFontSize, fontSize)
      }
    }

    if (currentTexts.length > 0) {
      lines.push({ text: currentTexts.join(' ').trim(), fontSize: currentFontSize })
    }

    pages.push(lines.filter((line) => line.text.length > 0))
  }

  return pages
}

function modeFontSize(pages: Line[][]): number {
  const counts = new Map<number, number>()
  for (const lines of pages) {
    for (const line of lines) {
      const rounded = Math.round(line.fontSize)
      counts.set(rounded, (counts.get(rounded) ?? 0) + 1)
    }
  }

  let best = 12
  let bestCount = 0
  for (const [size, count] of counts) {
    if (count > bestCount) {
      best = size
      bestCount = count
    }
  }
  return best
}

function lineToMarkdown(line: Line, bodySize: number): string {
  if (line.fontSize >= bodySize * HEADING_1_RATIO) return `# ${line.text}`
  if (line.fontSize >= bodySize * HEADING_2_RATIO) return `## ${line.text}`
  return line.text
}

export async function convertPdfToMarkdown(pdfPath: string): Promise<string> {
  const pages = await extractLines(pdfPath)
  const bodySize = modeFontSize(pages)

  const pageBlocks = pages.map((lines) =>
    lines.map((line) => lineToMarkdown(line, bodySize)).join('\n\n')
  )

  return pageBlocks.join('\n\n---\n\n')
}
