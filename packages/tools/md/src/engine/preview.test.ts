import { describe, it, expect, afterEach } from 'vitest'
import { mkdtemp, writeFile, mkdir, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { startPreviewServer, type PreviewServer } from './preview.js'

let dir: string
let server: PreviewServer | undefined

afterEach(async () => {
  if (server) {
    await server.close()
    server = undefined
  }
  if (dir) await rm(dir, { recursive: true, force: true })
})

describe('startPreviewServer', () => {
  it('serves the rendered markdown as html', async () => {
    dir = await mkdtemp(join(tmpdir(), 'mirror-md-preview-'))
    const source = join(dir, 'doc.md')
    await writeFile(source, '# Hello')

    server = await startPreviewServer(source, 0)
    expect(server.url).toMatch(/^http:\/\/localhost:\d+$/)

    const response = await fetch(server.url)
    const html = await response.text()
    expect(html).toContain('<h1 id="hello">Hello</h1>')
    expect(html).toContain('EventSource')
  })

  it('re-renders on every request, reflecting file edits', async () => {
    dir = await mkdtemp(join(tmpdir(), 'mirror-md-preview-'))
    const source = join(dir, 'doc.md')
    await writeFile(source, '# First')

    server = await startPreviewServer(source, 0)
    const first = await (await fetch(server.url)).text()
    expect(first).toContain('<h1 id="first">First</h1>')

    await writeFile(source, '# Second')
    const second = await (await fetch(server.url)).text()
    expect(second).toContain('<h1 id="second">Second</h1>')
  })

  it('rejects instead of crashing when the port is already in use', async () => {
    dir = await mkdtemp(join(tmpdir(), 'mirror-md-preview-'))
    const source = join(dir, 'doc.md')
    await writeFile(source, '# Hello')

    server = await startPreviewServer(source, 0)
    const busyPort = Number(new URL(server.url).port)

    await expect(startPreviewServer(source, busyPort)).rejects.toThrow()
  })

  it('serves an image referenced by a relative path next to the source file', async () => {
    dir = await mkdtemp(join(tmpdir(), 'mirror-md-preview-'))
    const source = join(dir, 'doc.md')
    await mkdir(join(dir, 'assets'))
    const pngBytes = Buffer.from([0x89, 0x50, 0x4e, 0x47])
    await writeFile(join(dir, 'assets', 'logo.png'), pngBytes)
    await writeFile(source, '# Hello\n\n![](assets/logo.png)')

    server = await startPreviewServer(source, 0)
    const response = await fetch(`${server.url}/assets/logo.png`)
    expect(response.status).toBe(200)
    expect(response.headers.get('content-type')).toBe('image/png')
    expect(Buffer.from(await response.arrayBuffer())).toEqual(pngBytes)
  })

  it('refuses to serve files outside the source directory', async () => {
    dir = await mkdtemp(join(tmpdir(), 'mirror-md-preview-'))
    const source = join(dir, 'doc.md')
    const outsideFile = join(tmpdir(), 'mirror-md-preview-secret.png')
    await writeFile(outsideFile, 'top secret bytes')
    await writeFile(source, '# Hello')

    server = await startPreviewServer(source, 0)
    const response = await fetch(`${server.url}/..%2fmirror-md-preview-secret.png`)
    const body = await response.text()

    expect(body).not.toContain('top secret bytes')
    await rm(outsideFile, { force: true })
  })

  it('pushes a reload event over sse when the source file changes', async () => {
    dir = await mkdtemp(join(tmpdir(), 'mirror-md-preview-'))
    const source = join(dir, 'doc.md')
    await writeFile(source, '# Hello')

    server = await startPreviewServer(source, 0)

    const response = await fetch(`${server.url}/__md-preview-events`)
    const reader = response.body?.getReader()
    expect(reader).toBeDefined()

    // the connection handshake writes an initial blank line, drain it first
    await reader!.read()

    await writeFile(source, '# Hello again')

    const { value } = await reader!.read()
    const text = new TextDecoder().decode(value)
    expect(text).toContain('data: reload')
  }, 5000)
})
