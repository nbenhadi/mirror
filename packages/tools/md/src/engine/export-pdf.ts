import { writeFile, rm } from 'node:fs/promises'
import { join } from 'node:path'
import { pathToFileURL } from 'node:url'
import { randomUUID } from 'node:crypto'
import type { BrowserType, Page } from 'playwright'
import type { ToolError } from '@nbenhadi/mirror-core'
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

const PAGE_RANGE_ERROR_PATTERN = /page range exceeds page count/i

export function isPageRangeError(err: unknown): boolean {
  return err instanceof Error && PAGE_RANGE_ERROR_PATTERN.test(err.message)
}

export class PlaywrightUnavailableError extends Error {
  constructor() {
    super('playwright is not installed')
    this.name = 'PlaywrightUnavailableError'
  }
}

export function isPlaywrightUnavailableError(err: unknown): boolean {
  return err instanceof PlaywrightUnavailableError
}

const BROWSER_MISSING_PATTERN = /executable doesn't exist/i

export function isPlaywrightBrowserMissingError(err: unknown): boolean {
  return err instanceof Error && BROWSER_MISSING_PATTERN.test(err.message)
}

export function toPlaywrightToolError(err: unknown): ToolError | undefined {
  if (isPlaywrightUnavailableError(err)) {
    return { code: 'EXECUTION_ERROR', message: 'cmd.md.error.playwright_unavailable' }
  }
  if (isPlaywrightBrowserMissingError(err)) {
    return { code: 'EXECUTION_ERROR', message: 'cmd.md.error.playwright_browser_missing' }
  }
  return undefined
}

let cachedChromium: BrowserType | undefined

async function loadChromium(): Promise<BrowserType> {
  if (cachedChromium) return cachedChromium
  try {
    const playwright = await import('playwright')
    cachedChromium = playwright.chromium
    return cachedChromium
  } catch {
    throw new PlaywrightUnavailableError()
  }
}

async function loadHtml(page: Page, html: string, baseDir?: string): Promise<void> {
  if (!baseDir) {
    await page.setContent(html, { waitUntil: 'networkidle' })
    return
  }

  const tempHtmlPath = join(baseDir, `.mirror-render-${randomUUID()}.html`)
  await writeFile(tempHtmlPath, html, 'utf-8')
  try {
    await page.goto(pathToFileURL(tempHtmlPath).href, { waitUntil: 'networkidle' })
  } finally {
    await rm(tempHtmlPath, { force: true })
  }
}

export interface SlidesExportOptions {
  format: 'pdf' | 'html'
  outputPath: string
  baseDir?: string
}

export async function exportSlides(html: string, options: SlidesExportOptions): Promise<void> {
  if (options.format === 'html') {
    await writeFile(options.outputPath, html, 'utf-8')
    return
  }

  const browser = await (await loadChromium()).launch()
  try {
    const page = await browser.newPage()
    await loadHtml(page, html, options.baseDir)
    const pdf = await page.pdf({
      printBackground: true,
      preferCSSPageSize: true,
    })
    await writeFile(options.outputPath, pdf)
  } finally {
    await browser.close()
  }
}

export async function exportDocument(html: string, options: ExportOptions): Promise<void> {
  if (options.format === 'html') {
    await writeFile(options.outputPath, html, 'utf-8')
    return
  }

  const browser = await (await loadChromium()).launch()
  try {
    const page = await browser.newPage()

    await loadHtml(page, html, options.baseDir)

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

      const pdf = await page.pdf({
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
      await writeFile(options.outputPath, pdf)
      return
    }

    const png = await page.screenshot({ fullPage: true })
    await writeFile(options.outputPath, png)
  } finally {
    await browser.close()
  }
}
