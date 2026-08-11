import TurndownService from 'turndown'

export function convertHtmlToMarkdown(html: string): string {
  const turndown = new TurndownService({
    headingStyle: 'atx',
    codeBlockStyle: 'fenced',
    bulletListMarker: '-',
  })
  turndown.remove(['style', 'script', 'title'])
  return turndown.turndown(html)
}
