import type { BundledTheme } from './types.js'

interface PaperTokens {
  paper: string
}

interface AccentTokens {
  ink: string
  inkMuted: string
  accent: string
  accentInk: string
  accentSoft: string
  border: string
  codeBg: string
}

const FALLBACK_PAPER_TOKENS: PaperTokens = { paper: '#ffffff' }

const PAPER_TOKENS: Record<string, PaperTokens> = {
  white: FALLBACK_PAPER_TOKENS,
  cream: { paper: '#fbf8f2' },
  grey: { paper: '#f7f7f8' },
}

const FALLBACK_ACCENT_TOKENS: AccentTokens = {
  ink: '#23222b',
  inkMuted: '#6b6878',
  accent: '#4b3f8f',
  accentInk: '#2f265f',
  accentSoft: '#e9e6f4',
  border: '#dfdbea',
  codeBg: '#f2f1f7',
}

const ACCENT_TOKENS: Record<string, AccentTokens> = {
  indigo: FALLBACK_ACCENT_TOKENS,
  rust: {
    ink: '#26221f',
    inkMuted: '#756c64',
    accent: '#b5502f',
    accentInk: '#7a3115',
    accentSoft: '#f4e4d9',
    border: '#e8ddd1',
    codeBg: '#f5efe6',
  },
  amber: {
    ink: '#1c2230',
    inkMuted: '#5e697b',
    accent: '#b9821f',
    accentInk: '#6e4c0f',
    accentSoft: '#f5e9d0',
    border: '#e2e4e9',
    codeBg: '#f4f2ec',
  },
  plum: {
    ink: '#241f24',
    inkMuted: '#736e78',
    accent: '#7a3b56',
    accentInk: '#4c1f31',
    accentSoft: '#f3e3e9',
    border: '#e8dfe3',
    codeBg: '#f5f0f2',
  },
  blue: {
    ink: '#1e232a',
    inkMuted: '#5f6a76',
    accent: '#2563a8',
    accentInk: '#12385f',
    accentSoft: '#e2edf7',
    border: '#dfe4ea',
    codeBg: '#f0f2f5',
  },
}

export const PAPER_IDS = Object.keys(PAPER_TOKENS)
export const ACCENT_IDS = Object.keys(ACCENT_TOKENS)
export const DEFAULT_PAPER = 'white'
export const DEFAULT_ACCENT = 'indigo'

export function resolvePaperColor(paperId: string | undefined): string {
  const id = paperId && PAPER_IDS.includes(paperId) ? paperId : DEFAULT_PAPER
  return (PAPER_TOKENS[id] ?? FALLBACK_PAPER_TOKENS).paper
}

export function resolveAccentTokens(accentId: string | undefined): AccentTokens {
  const id = accentId && ACCENT_IDS.includes(accentId) ? accentId : DEFAULT_ACCENT
  return ACCENT_TOKENS[id] ?? FALLBACK_ACCENT_TOKENS
}

export const FONT_SANS = "-apple-system, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif"
const FONT_HEADING = "'Avenir Next', 'Century Gothic', ui-sans-serif, sans-serif"
const FONT_MONO = "ui-monospace, 'SF Mono', 'Cascadia Code', 'Roboto Mono', monospace"

const FONT_BASE = '16px'
const FONT_SM = '0.875rem'
const FONT_H1 = '2.1rem'
const FONT_H2 = '1.15rem'
const FONT_H3 = '1.05rem'
const FONT_H4 = '0.9rem'
const FONT_H5 = '0.82rem'
const FONT_H6 = '0.76rem'

const SPACE_SM = '0.5em'
const SPACE_MD = '1em'
const SPACE_LG = '1.75em'

export const BODY_CONTENT_INSET_PX = 56

function paperVariants(): string {
  return Object.entries(PAPER_TOKENS)
    .map(([id, t]) => `:root[data-paper="${id}"] { --paper: ${t.paper}; }`)
    .join('\n')
}

function accentVariants(): string {
  return Object.entries(ACCENT_TOKENS)
    .map(
      ([id, t]) => `:root[data-accent="${id}"] {
  --ink: ${t.ink};
  --ink-muted: ${t.inkMuted};
  --accent: ${t.accent};
  --accent-ink: ${t.accentInk};
  --accent-soft: ${t.accentSoft};
  --border: ${t.border};
  --code-bg: ${t.codeBg};
}`
    )
    .join('\n')
}

export const defaultTheme: BundledTheme = {
  id: 'default',
  description: 'soft modern layout for any document, configurable paper and accent',
  css: `
${paperVariants()}
${accentVariants()}

html {
  background: var(--paper);
}

body {
  font-family: ${FONT_SANS};
  font-size: ${FONT_BASE};
  line-height: 1.65;
  color: var(--ink);
  background: var(--paper);
  margin: 0 auto;
}

.columns {
  display: flex;
  gap: 2rem;
  align-items: flex-start;
}

.main {
  flex: 2;
  min-width: 0;
}

.side {
  flex: 1;
  min-width: 0;
}

.row {
  display: flex;
  gap: 1rem;
  align-items: center;
}

.row > * {
  flex: 1;
  min-width: 0;
}

.row img {
  display: block;
  width: 100%;
}

.center {
  text-align: center;
}

.left {
  text-align: left;
}

.right {
  text-align: right;
}

.justify {
  text-align: justify;
}

.row.center {
  justify-content: center;
}

.row.center > * {
  flex: none;
  min-width: 0;
}

.row.center img {
  display: inline-block;
  width: auto;
}

.landscape {
  page: landscape;
  break-inside: avoid;
  width: calc(297mm - 40px);
}

.landscape img {
  display: block;
}

.landscape em {
  display: block;
  margin-top: ${SPACE_SM};
  text-align: left;
  color: var(--ink-muted);
  font-size: ${FONT_SM};
}

.pagebreak {
  break-after: page;
}

@page {
  background: var(--paper);
}

@page landscape {
  size: A4 landscape;
}

h1, h2, h3, h4, h5, h6 {
  font-family: ${FONT_HEADING};
  font-weight: 800;
  line-height: 1.25;
  break-after: avoid;
}

h1 {
  display: block;
  font-size: ${FONT_H1};
  letter-spacing: -0.01em;
  color: var(--accent-ink);
  background: var(--accent-soft);
  padding: 0.55em 0.9em;
  margin-bottom: 1.4em;
  border-radius: 12px;
}

h2 {
  font-size: ${FONT_H2};
  letter-spacing: 0.005em;
  color: var(--accent);
  margin-bottom: ${SPACE_MD};
}

h3 {
  font-size: ${FONT_H3};
  font-weight: 700;
  color: var(--ink);
  margin-bottom: ${SPACE_MD};
}

h4 {
  font-size: ${FONT_H4};
  font-weight: 600;
  color: var(--ink-muted);
  margin-bottom: ${SPACE_MD};
}

h5 {
  font-size: ${FONT_H5};
  font-weight: 700;
  color: var(--ink-muted);
  margin-bottom: ${SPACE_MD};
}

h6 {
  font-size: ${FONT_H6};
  font-weight: 600;
  color: var(--ink-muted);
  text-transform: uppercase;
  letter-spacing: 0.04em;
  margin-bottom: ${SPACE_MD};
}

p, ul, ol, table, blockquote, pre {
  margin-bottom: ${SPACE_MD};
}

ul, ol {
  padding-left: 1.5em;
}

li::marker {
  color: var(--accent);
}

a {
  color: var(--accent);
}

strong {
  font-weight: 700;
}

.footer {
  margin-top: ${SPACE_LG};
  padding-top: ${SPACE_SM};
  border-top: 1px solid var(--border);
  color: var(--ink-muted);
  font-size: ${FONT_SM};
}

blockquote {
  padding: 0.9em 1.1em;
  background: var(--accent-soft);
  border-radius: 10px;
  color: var(--ink);
  font-size: 0.95rem;
  break-inside: avoid;
}

blockquote p {
  margin: 0;
}

blockquote blockquote {
  margin-top: ${SPACE_SM};
  margin-bottom: 0;
}

table {
  width: 100%;
  font-size: ${FONT_SM};
  border-collapse: separate;
  border-spacing: 0;
  border: 1px solid var(--border);
  border-radius: 10px;
  overflow: hidden;
  break-inside: avoid;
}

thead tr:not(:has(th:not(:empty))) {
  display: none;
}

th, td {
  border-bottom: 1px solid var(--border);
  padding: 0.6em 0.85em;
  text-align: left;
}

tbody tr:last-child td {
  border-bottom: none;
}

th {
  background: var(--accent-soft);
  color: var(--accent-ink);
  font-weight: 700;
  font-size: 0.78rem;
  text-transform: uppercase;
  letter-spacing: 0.04em;
}

td {
  font-variant-numeric: tabular-nums;
}

code {
  font-family: ${FONT_MONO};
  background: var(--code-bg);
  padding: 0.15em 0.4em;
  border-radius: 5px;
  font-size: 0.85em;
}

pre {
  background: var(--code-bg);
  border: 1px solid var(--border);
  padding: ${SPACE_MD};
  border-radius: 10px;
  overflow-x: auto;
  break-inside: avoid;
}

pre code {
  background: none;
  padding: 0;
}

img {
  break-inside: avoid;
}

hr {
  border: none;
  border-top: 1px solid var(--border);
  margin: 2em 0;
}
`,
  margins: { x: 80, y: 50 },
}
