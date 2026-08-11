import { createServer, type Server, type IncomingMessage, type ServerResponse } from 'node:http'
import { readFile } from 'node:fs/promises'
import { dirname, extname, resolve } from 'node:path'
import { watch, type FSWatcher } from 'chokidar'
import { preparePipeline, renderHtml } from './pipeline.js'

const EVENTS_PATH = '/__md-preview-events'
const RELOAD_SNIPPET = `<script>new EventSource('${EVENTS_PATH}').onmessage=()=>location.reload()</script>`

const ASSET_MIME_TYPES: Record<string, string> = {
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif',
  '.svg': 'image/svg+xml',
  '.webp': 'image/webp',
  '.ico': 'image/x-icon',
}

function injectReloadScript(html: string): string {
  if (html.includes('</body>')) return html.replace('</body>', `${RELOAD_SNIPPET}</body>`)
  return html + RELOAD_SNIPPET
}

async function serveAsset(
  sourceDir: string,
  pathname: string,
  res: ServerResponse
): Promise<boolean> {
  const mimeType = ASSET_MIME_TYPES[extname(pathname).toLowerCase()]
  if (!mimeType) return false

  const baseDir = resolve(sourceDir)
  const assetPath = resolve(baseDir, `.${pathname}`)
  if (!assetPath.startsWith(`${baseDir}/`)) return false

  try {
    const data = await readFile(assetPath)
    res.writeHead(200, { 'Content-Type': mimeType })
    res.end(data)
    return true
  } catch {
    return false
  }
}

async function renderPreviewHtml(sourcePath: string, theme: string | undefined): Promise<string> {
  const source = await readFile(sourcePath, 'utf-8')
  const { content, plugins, renderContext } = await preparePipeline(sourcePath, source, 'html')

  if (theme) {
    renderContext.frontMatter = { ...renderContext.frontMatter, theme }
  }

  const html = await renderHtml(content, plugins, renderContext, false)
  return injectReloadScript(html)
}

export interface PreviewServer {
  url: string
  close: () => Promise<void>
}

export async function startPreviewServer(sourcePath: string, port: number): Promise<PreviewServer> {
  const clients = new Set<ServerResponse>()

  async function handleRequest(req: IncomingMessage, res: ServerResponse): Promise<void> {
    const url = new URL(req.url ?? '/', 'http://localhost')

    if (url.pathname === EVENTS_PATH) {
      res.writeHead(200, {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        Connection: 'keep-alive',
      })
      res.write('\n')
      clients.add(res)
      req.on('close', () => clients.delete(res))
      return
    }

    if (url.pathname !== '/' && (await serveAsset(dirname(sourcePath), url.pathname, res))) {
      return
    }

    try {
      const theme = url.searchParams.get('theme') ?? undefined
      const html = await renderPreviewHtml(sourcePath, theme)
      res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' })
      res.end(html)
    } catch (err) {
      res.writeHead(500, { 'Content-Type': 'text/plain; charset=utf-8' })
      res.end(err instanceof Error ? err.message : String(err))
    }
  }

  const server: Server = createServer((req, res) => {
    void handleRequest(req, res)
  })

  await new Promise<void>((resolveListen, rejectListen) => {
    server.once('error', rejectListen)
    server.listen(port, () => {
      server.off('error', rejectListen)
      resolveListen()
    })
  })

  const address = server.address()
  const actualPort = typeof address === 'object' && address !== null ? address.port : port

  const watcher: FSWatcher = watch(sourcePath, { ignoreInitial: true })
  watcher.on('change', () => {
    for (const client of clients) client.write('data: reload\n\n')
  })

  return {
    url: `http://localhost:${actualPort}`,
    close: async () => {
      for (const client of clients) client.end()
      await watcher.close()
      await new Promise<void>((resolveClose, rejectClose) => {
        server.close((err) => (err ? rejectClose(err) : resolveClose()))
      })
    },
  }
}
