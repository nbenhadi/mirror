import { describe, it, expect, afterEach } from 'vitest'
import { mkdtemp, writeFile, mkdir, stat, readdir, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { exportDocument } from './export-pdf.js'

let dir: string

afterEach(async () => {
  if (dir) await rm(dir, { recursive: true, force: true })
})

describe('exportDocument', () => {
  it('writes html format directly without launching a browser', async () => {
    dir = await mkdtemp(join(tmpdir(), 'mirror-md-export-'))
    const outputPath = join(dir, 'out.html')

    await exportDocument('<h1>Hello</h1>', { format: 'html', outputPath })

    const written = await stat(outputPath)
    expect(written.isFile()).toBe(true)
  })

  it('resolves relative image paths against baseDir when rendering to png', async () => {
    dir = await mkdtemp(join(tmpdir(), 'mirror-md-export-'))
    await mkdir(join(dir, 'assets'))
    const pngBytes = Buffer.from(
      'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=',
      'base64'
    )
    await writeFile(join(dir, 'assets', 'dot.png'), pngBytes)

    const outputPath = join(dir, 'out.png')
    await exportDocument('<img src="assets/dot.png" width="200" height="200">', {
      format: 'png',
      outputPath,
      baseDir: dir,
    })

    const written = await stat(outputPath)
    expect(written.size).toBeGreaterThan(0)
  }, 15000)

  it('does not leak the temporary render file used to resolve relative assets', async () => {
    dir = await mkdtemp(join(tmpdir(), 'mirror-md-export-'))
    const outputPath = join(dir, 'out.png')

    await exportDocument('<h1>No assets here</h1>', {
      format: 'png',
      outputPath,
      baseDir: dir,
    })

    const entries = await readdir(dir)
    const leftoverTempFiles = entries.filter((name) => name.startsWith('.mirror-render-'))
    expect(leftoverTempFiles).toEqual([])
  }, 15000)
})
