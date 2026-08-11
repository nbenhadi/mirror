import { LATO_REGULAR_WOFF2, LATO_BOLD_WOFF2 } from './fonts/lato.js'
import type { BundledTheme } from './types.js'

const ACCENT_COLOR = '#6A84F6'
const TEXT_COLOR = '#000'
const BODY_COLOR = '#767676'
const MUTED_COLOR = '#535353'
const DATE_COLOR = '#818ea1'
const BORDER_COLOR = '#e2e8f0'
const SURFACE_COLOR = '#f8fafc'
const CODE_BG_COLOR = '#f1f5f9'

const FONT_SIZE_BASE = '8pt'
const FONT_SIZE_H1 = '31pt'
const FONT_SIZE_H2 = '10pt'
const FONT_SIZE_DATE = '7pt'
const FONT_WEIGHT_REGULAR = '400'
const FONT_WEIGHT_BOLD = '700'

const PAGE_WIDTH = '595pt'
const COLUMN_GAP = '54pt'
const SIDE_RATIO = '172 1 0px'
const MAIN_RATIO = '305 1 0px'
const TAGLINE_WIDTH = '245pt'
const LIST_INDENT = '12pt'

const SPACE_XS = '4pt'
const SPACE_SM = '6pt'
const DATE_GAP = '0.7em'

export const cvTheme: BundledTheme = {
  id: 'cv',
  description: 'modern, polished two-column layout',
  css: `
@font-face {
  font-family: 'Lato';
  font-style: normal;
  font-weight: ${FONT_WEIGHT_REGULAR};
  src: url(data:font/woff2;base64,${LATO_REGULAR_WOFF2}) format('woff2');
}

@font-face {
  font-family: 'Lato';
  font-style: normal;
  font-weight: ${FONT_WEIGHT_BOLD};
  src: url(data:font/woff2;base64,${LATO_BOLD_WOFF2}) format('woff2');
}

body {
  font-family: 'Lato', sans-serif;
  font-size: ${FONT_SIZE_BASE};
  line-height: 1.5;
  color: ${TEXT_COLOR};
  max-width: ${PAGE_WIDTH};
  margin: 0 auto;
}

.container {
  display: flex;
  gap: ${COLUMN_GAP};
  align-items: flex-start;
}

.side {
  flex: ${SIDE_RATIO};
  min-width: 0;
}

.main {
  flex: ${MAIN_RATIO};
  min-width: 0;
}

.gap {
  height: 1em;
}

.row {
  display: flex;
  gap: 0.75em;
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

h1 {
  font-size: ${FONT_SIZE_H1};
  font-weight: ${FONT_WEIGHT_BOLD};
  color: ${ACCENT_COLOR};
  margin: 0 0 ${SPACE_SM};
}

.main > p:first-child {
  max-width: ${TAGLINE_WIDTH};
}

h2 {
  font-size: ${FONT_SIZE_H2};
  font-weight: ${FONT_WEIGHT_BOLD};
  color: ${ACCENT_COLOR};
  margin: 1.6em 0 0.6em;
}

h3 {
  font-size: ${FONT_SIZE_BASE};
  font-weight: ${FONT_WEIGHT_REGULAR};
  color: ${TEXT_COLOR};
  margin: 1em 0 0.3em;
}

p {
  font-size: ${FONT_SIZE_BASE};
  color: ${MUTED_COLOR};
  margin: 0 0 0.6em;
}

ul {
  margin: 0 0 1em ${LIST_INDENT};
  padding: 0;
}

li {
  font-size: ${FONT_SIZE_BASE};
  color: ${BODY_COLOR};
  line-height: 1.6;
  margin-bottom: ${SPACE_XS};
}

li::marker {
  color: ${BODY_COLOR};
}

a {
  color: inherit;
  text-decoration: underline;
}

strong {
  font-weight: ${FONT_WEIGHT_BOLD};
  color: ${TEXT_COLOR};
}

.date {
  font-size: ${FONT_SIZE_DATE};
  font-weight: ${FONT_WEIGHT_REGULAR};
  color: ${DATE_COLOR};
  white-space: nowrap;
  margin-left: ${DATE_GAP};
}

blockquote {
  border-left: 2px solid ${ACCENT_COLOR};
  padding-left: 1em;
  color: ${MUTED_COLOR};
  margin: 0 0 1em;
}

table {
  width: 100%;
  border-collapse: collapse;
  font-size: ${FONT_SIZE_BASE};
  margin: 0 0 1em;
}

thead tr:not(:has(th:not(:empty))) {
  display: none;
}

th, td {
  border: 1px solid ${BORDER_COLOR};
  padding: 0.4em 0.6em;
  text-align: left;
}

th {
  background: ${SURFACE_COLOR};
  font-weight: ${FONT_WEIGHT_BOLD};
}

code {
  font-family: monospace;
  background: ${CODE_BG_COLOR};
  padding: 0.1em 0.3em;
  border-radius: 3px;
  font-size: 0.9em;
}

pre {
  background: ${CODE_BG_COLOR};
  padding: 1em;
  border-radius: 6px;
  overflow-x: auto;
  margin: 0 0 1em;
}

pre code {
  background: none;
  padding: 0;
}

hr {
  border: none;
  border-top: 1px solid ${BORDER_COLOR};
  margin: 2em 0;
}
  `,
  margins: { x: 43, y: 45 },
}
