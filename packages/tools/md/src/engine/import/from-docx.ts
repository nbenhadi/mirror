import mammoth from 'mammoth'
import { convertHtmlToMarkdown } from './from-html.js'

export async function convertDocxToMarkdown(docxPath: string): Promise<string> {
  const { value: html } = await mammoth.convertToHtml({ path: docxPath })
  return convertHtmlToMarkdown(html)
}
