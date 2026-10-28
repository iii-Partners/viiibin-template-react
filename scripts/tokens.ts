// Turns design-system/tokens.json into src/styles/tokens.css: the theme variables for Daylight (light, the default)
// and Command (dark, under the theme store's `.dark` class), and the Tailwind theme that reads them. The Vite config
// runs this on start and again whenever tokens.json changes. Run by hand with `npm run tokens`.
import { readFileSync, writeFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const here = dirname(fileURLToPath(import.meta.url))
export const TOKENS_JSON = resolve(here, '../design-system/tokens.json')
export const TOKENS_CSS = resolve(here, '../src/styles/tokens.css')

type Themed = Record<string, string>
type Token<V> = { name: string; value: V; usage?: string }
type TypeStyle = { name: string; family?: string; fontSize: string; lineHeight: string; fontWeight: number; letterSpacing?: string }
type Group<V> = { note?: string; tokens: Token<V>[] }
type Tokens = {
  color: Group<Themed>
  type: { families: Record<string, string>; groups: { family?: string; styles: TypeStyle[] }[] }
  spacing: Group<string>
  radius: Group<string>
  chamfer: Group<string>
  shadow: Group<Themed>
  duration: Group<string>
  easing: Group<string>
  layout?: Group<string>
}

const scalars = (g: Group<string>) => g.tokens.map((x) => [x.name, x.value] as const)
const decl = (name: string, value: string) => `  --${name}: ${value};`

// ShadCN's color names, read from the design system's tokens, so ShadCN primitives and the system's own parts share
// one palette. `accent` keeps the system's meaning (the pointed-at foreground), so ShadCN's subtle accent fill is
// `accent-soft` here.
const SHADCN: [string, string][] = [
  ['background', 'var(--ground)'], ['foreground', 'var(--text)'],
  ['card', 'var(--glass)'], ['card-foreground', 'var(--text)'],
  ['popover', 'var(--glass)'], ['popover-foreground', 'var(--text)'],
  ['primary-foreground', 'var(--on-brand)'],
  ['secondary', 'var(--glass-raised)'], ['secondary-foreground', 'var(--text)'],
  ['muted', 'var(--glass-raised)'], ['muted-foreground', 'var(--dim)'],
  ['accent-soft', 'var(--glass-raised)'], ['accent-foreground', 'var(--text)'],
  ['destructive', 'var(--fault)'], ['destructive-foreground', '#ffffff'],
  ['border', 'var(--line)'], ['input', 'var(--teal)'], ['ring', 'var(--brand)'],
]

export function buildTokensCss(json: string): string {
  const t = JSON.parse(json) as Tokens
  const themed = (look: string) => [
    ...t.color.tokens.map((c) => decl(c.name, c.value[look])),
    ...t.shadow.tokens.map((x) => decl(x.name, x.value[look])),
  ].join('\n')
  // the safe frame grows with the window, from 16 px on a phone to the token's 44 px
  const spacing = scalars(t.spacing).map(([k, v]) => (k === 'safe' ? decl('spacing-safe', `clamp(16px, 3vw, ${v})`) : decl(`spacing-${k.replace(/^space-/, '')}`, v)))
  const families = Object.entries(t.type.families).map(([k, v]) => decl(`font-${k}`, v))
  const typeUtils = t.type.groups.flatMap((g) => g.styles.map((s) => {
    const family = s.family ?? g.family ?? 'body'
    return `@utility type-${s.name} {\n  font-family: var(--font-${family});\n  font-size: ${s.fontSize};\n  line-height: ${s.lineHeight};\n  font-weight: ${s.fontWeight};\n  letter-spacing: ${s.letterSpacing ?? '0'};\n}`
  }))
  return `/* Generated from design-system/tokens.json by scripts/tokens.ts. Edit tokens.json, not this file. */

/* Daylight is the default; Command applies only under the theme store's .dark class. */
:root {
${themed('daylight')}
  color-scheme: light;
}
.dark {
${themed('command')}
  color-scheme: dark;
}
:root {
${scalars(t.duration).map(([k, v]) => decl(k, v)).join('\n')}
${scalars(t.chamfer).map(([k, v]) => decl(k, v)).join('\n')}
${t.layout ? scalars(t.layout).map(([k, v]) => decl(k, v)).join('\n') : ''}
}

@theme {
  --color-*: initial;
  --font-*: initial;
  --radius-*: initial;
  --shadow-*: initial;
${families.join('\n')}
${scalars(t.radius).map(([k, v]) => decl(k, v)).join('\n')}
  /* ShadCN's radius names on the system's radii: rounded-sm a chip, rounded-md a button, rounded-lg a card, rounded-xl a panel */
  --radius-sm: 2px;
  --radius-md: 4px;
  --radius-lg: 10px;
  --radius-xl: 12px;
${spacing.join('\n')}
${scalars(t.easing).map(([k, v]) => decl(k, v)).join('\n')}
}

/* utilities such as bg-glass, text-dim, border-line and shadow-card read the live theme variables */
@theme inline {
  --color-white: #ffffff;
  --color-black: #000000;
  --color-transparent: transparent;
${t.color.tokens.map((c) => decl(`color-${c.name}`, `var(--${c.name})`)).join('\n')}
${SHADCN.map(([k, v]) => decl(`color-${k}`, v)).join('\n')}
${t.shadow.tokens.map((x) => decl(x.name, `var(--${x.name})`)).join('\n')}
}

/* type styles: type-display, type-title, type-figure, type-label, type-section, type-summary and the rest */
${typeUtils.join('\n')}
`
}

/** Writes tokens.css when it differs from what tokens.json makes. Returns whether it wrote. */
export function writeTokensCss(): boolean {
  const css = buildTokensCss(readFileSync(TOKENS_JSON, 'utf8'))
  let old = ''
  try { old = readFileSync(TOKENS_CSS, 'utf8') } catch { /* first run */ }
  if (old === css) return false
  writeFileSync(TOKENS_CSS, css)
  return true
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  writeTokensCss()
  console.log(`Wrote ${TOKENS_CSS}`)
}
