import { writeFile, rm } from 'node:fs/promises'
import { join } from 'node:path'
import { pathToFileURL } from 'node:url'
import { randomUUID } from 'node:crypto'
import { chromium } from 'playwright'
import type { Margins } from '../themes/types.js'

export interface ExportOptions {
  format: 'pdf' | 'html' | 'png'
  outputPath: string
  pages?: string
  baseDir?: string
  header?: string
  footer?: string
  margins?: Margins
}

export async function exportDocument(html: string, options: ExportOptions): Promise<void> {
  if (options.format === 'html') {
    await writeFile(options.outputPath, html, 'utf-8')
    return
  }

  const browser = await chromium.launch()
  try {
    const page = await browser.newPage()

    if (options.baseDir) {
      const tempHtmlPath = join(options.baseDir, `.mirror-render-${randomUUID()}.html`)
      await writeFile(tempHtmlPath, html, 'utf-8')
      try {
        await page.goto(pathToFileURL(tempHtmlPath).href, { waitUntil: 'networkidle' })
      } finally {
        await rm(tempHtmlPath, { force: true })
      }
    } else {
      await page.setContent(html, { waitUntil: 'networkidle' })
    }

    if (options.format === 'pdf') {
      const hasHeaderFooter = options.header !== undefined || options.footer !== undefined
      const pdfMargin = options.margins
        ? {
            top: `${options.margins.y}px`,
            left: `${options.margins.x}px`,
            right: `${options.margins.x}px`,
            bottom: `${options.margins.y}px`,
          }
        : { top: 0, left: 0, right: 0, bottom: 0 }

      await page.pdf({
        path: options.outputPath,
        format: 'A4',
        printBackground: true,
        preferCSSPageSize: true,
        margin: pdfMargin,
        ...(options.pages !== undefined && { pageRanges: options.pages }),
        ...(hasHeaderFooter && {
          displayHeaderFooter: true,
          headerTemplate: options.header ?? `<div></div>`,
          footerTemplate: options.footer ?? `<div></div>`,
        }),
      })
      return
    }

    await page.screenshot({ path: options.outputPath, fullPage: true })
  } finally {
    await browser.close()
  }
}
