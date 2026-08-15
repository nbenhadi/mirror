import { readFile } from 'node:fs/promises'
import { getDocument } from 'pdfjs-dist/legacy/build/pdf.mjs'

export async function extractPageTexts(pdfPath: string): Promise<string[]> {
  const data = await readFile(pdfPath)
  const doc = await getDocument({ data: new Uint8Array(data) }).promise
  const pages: string[] = []

  for (let i = 1; i <= doc.numPages; i++) {
    const page = await doc.getPage(i)
    const content = await page.getTextContent()
    const text = content.items.map((item) => ('str' in item ? item.str : '')).join(' ')
    pages.push(text)
  }

  return pages
}

export async function resolveAnchorPages(
  pdfPath: string,
  ids: string[]
): Promise<Record<string, number>> {
  const data = await readFile(pdfPath)
  const doc = await getDocument({ data: new Uint8Array(data) }).promise
  const pages: Record<string, number> = {}

  for (const id of ids) {
    const dest = await doc.getDestination(id)
    const ref = dest?.[0]
    if (ref === undefined) continue
    pages[id] = (await doc.getPageIndex(ref)) + 1
  }

  return pages
}
