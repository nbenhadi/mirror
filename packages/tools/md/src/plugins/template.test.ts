import { describe, it, expect, afterEach } from 'vitest'
import { mkdtemp, writeFile, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { createTemplatePlugin, isTemplateDataError } from './template.js'
import type { RenderContext } from './types.js'

function buildContext(data: unknown, sourcePath = '/doc.md'): RenderContext {
  return { sourcePath, frontMatter: { data }, format: 'html', state: {} }
}

let dir: string

afterEach(async () => {
  if (dir) await rm(dir, { recursive: true, force: true })
})

describe('template plugin', () => {
  it('leaves the source untouched when there is no data', async () => {
    const source = 'Patient: {{name}}'
    const result = await createTemplatePlugin().transformSource?.(source, buildContext(undefined))
    expect(result).toBe(source)
  })

  it('fills in simple fields from an inline object', async () => {
    const source = 'Patient: {{name}} {{lastName}}'
    const result = await createTemplatePlugin().transformSource?.(
      source,
      buildContext({ name: 'Ana', lastName: 'Perez' })
    )
    expect(result).toBe('Patient: Ana Perez')
  })

  it('repeats a block once per item with {{#each}}', async () => {
    const source = '{{#each patients}}# {{name}}\n\n::pagebreak\n\n{{/each}}'
    const result = await createTemplatePlugin().transformSource?.(
      source,
      buildContext({ patients: [{ name: 'Ana' }, { name: 'Luis' }] })
    )
    expect(result).toBe('# Ana\n\n::pagebreak\n\n# Luis\n\n::pagebreak\n\n')
  })

  it('does not html-escape values, since the output is markdown, not html', async () => {
    const source = '{{note}}'
    const result = await createTemplatePlugin().transformSource?.(
      source,
      buildContext({ note: 'A & B' })
    )
    expect(result).toBe('A & B')
  })

  it('renders missing fields as empty instead of throwing', async () => {
    const source = 'Name: {{name}}, Age: {{age}}'
    const result = await createTemplatePlugin().transformSource?.(
      source,
      buildContext({ name: 'Ana' })
    )
    expect(result).toBe('Name: Ana, Age: ')
  })

  it('loads data from a json file referenced in front matter', async () => {
    dir = await mkdtemp(join(tmpdir(), 'mirror-md-template-'))
    const dataPath = join(dir, 'patients.json')
    await writeFile(dataPath, JSON.stringify({ name: 'Ana' }))

    const result = await createTemplatePlugin().transformSource?.(
      'Patient: {{name}}',
      buildContext('patients.json', join(dir, 'doc.md'))
    )
    expect(result).toBe('Patient: Ana')
  })

  it('loads data from a yaml file referenced in front matter', async () => {
    dir = await mkdtemp(join(tmpdir(), 'mirror-md-template-'))
    const dataPath = join(dir, 'patients.yaml')
    await writeFile(dataPath, 'name: Ana\n')

    const result = await createTemplatePlugin().transformSource?.(
      'Patient: {{name}}',
      buildContext('patients.yaml', join(dir, 'doc.md'))
    )
    expect(result).toBe('Patient: Ana')
  })

  it('raises a template data error when the referenced file does not exist', async () => {
    dir = await mkdtemp(join(tmpdir(), 'mirror-md-template-'))

    await expect(
      createTemplatePlugin().transformSource?.(
        'Patient: {{name}}',
        buildContext('missing.json', join(dir, 'doc.md'))
      )
    ).rejects.toSatisfy(isTemplateDataError)
  })

  it('raises a template data error for an unsupported data file extension', async () => {
    dir = await mkdtemp(join(tmpdir(), 'mirror-md-template-'))
    await writeFile(join(dir, 'patients.txt'), 'name: Ana')

    await expect(
      createTemplatePlugin().transformSource?.(
        'Patient: {{name}}',
        buildContext('patients.txt', join(dir, 'doc.md'))
      )
    ).rejects.toSatisfy(isTemplateDataError)
  })
})
