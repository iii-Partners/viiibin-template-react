// Turns design-system/tokens.json into src/styles/tokens.css: the theme variables for Shore (light, the default)
// and Deep (dark, under the theme store's `.dark` class), the Tailwind theme that reads them, and the design variants.
// A variant applies to the whole app as `<html data-variant="aman">`, or to one element and its children as
// `data-variant-scope="aman"` (the Design system screen's gallery). It also writes src/design/variants.json, the list
// the app reads to offer and load the variants. The Vite config runs this on start and again whenever tokens.json
// changes. Run by hand with `npm run tokens`.
import { readFileSync, writeFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const here = dirname(fileURLToPath(import.meta.url))
export const TOKENS_JSON = resolve(here, '../design-system/tokens.json')
export const TOKENS_CSS = resolve(here, '../src/styles/tokens.css')
export const VARIANTS_JSON = resolve(here, '../src/design/variants.json')

type Themed = Record<string, string>
type Token<V> = { name: string; value: V; usage?: string }
type TypeStyle = { name: string; family?: string; fontSize: string; lineHeight: string; fontWeight: number; letterSpacing?: string; textTransform?: string }
type Group<V> = { note?: string; tokens: Token<V>[] }
export type Variant = { id: string; name: string; note: string; signature: string; fonts: string; families: Record<string, string>; vars: Record<string, string>; light: Themed; dark: Themed }
type Tokens = {
  color: Group<Themed>
  type: { families: Record<string, string>; groups: { family?: string; styles: TypeStyle[] }[] }
  spacing: Group<string>
  radius: Group<string>
  shape: Group<string>
  shadow: Group<Themed>
  duration: Group<string>
  easing: Group<string>
  layout?: Group<string>
  variants: { list: Variant[] }
}

const scalars = (g: Group<string>) => g.tokens.map((x) => [x.name, x.value] as const)
const decl = (name: string, value: string) => `  --${name}: ${value};`

// ShadCN's color names, read from the design system's tokens, so ShadCN primitives and the system's own parts share
// one palette. `accent` keeps the system's meaning (the pointed-at foreground), so ShadCN's subtle accent fill is
// `accent-soft` here.
const SHADCN: [string, string][] = [
  ['background', 'var(--ground)'], ['foreground', 'var(--text)'],
  ['card', 'var(--panel)'], ['card-foreground', 'var(--text)'],
  ['popover', 'var(--panel)'], ['popover-foreground', 'var(--text)'],
  ['primary-foreground', 'var(--on-primary)'],
  ['secondary', 'var(--wash)'], ['secondary-foreground', 'var(--text)'],
  ['muted', 'var(--wash)'], ['muted-foreground', 'var(--dim)'],
  ['accent-soft', 'var(--wash)'], ['accent-foreground', 'var(--text)'],
  ['destructive', 'var(--fault)'], ['destructive-foreground', 'var(--on-primary)'],
  ['border', 'var(--line)'], ['input', 'var(--edge)'], ['ring', 'var(--focus)'],
]

export function buildTokensCss(json: string): string {
  const t = JSON.parse(json) as Tokens
  const themed = (look: string) => [
    ...t.color.tokens.map((c) => decl(c.name, c.value[look])),
    ...t.shadow.tokens.map((x) => decl(x.name, x.value[look])),
  ].join('\n')
  // the safe frame grows with the window, from 16 px on a phone to the token's 48 px
  const spacing = scalars(t.spacing).map(([k, v]) => (k === 'safe' ? decl('spacing-safe', `clamp(16px, 3.5vw, ${v})`) : decl(`spacing-${k.replace(/^space-/, '')}`, v)))
  const families = Object.entries(t.type.families).map(([k, v]) => decl(`font-${k}`, v))
  const typeUtils = t.type.groups.flatMap((g) => g.styles.map((s) => {
    const family = s.family ?? g.family ?? 'body'
    // display styles follow the variant's heading voice: its case, style and tracking; a light weight follows its weight
    const display = family === 'display'
    const transform = s.textTransform ? `\n  text-transform: ${s.textTransform};` : display ? '\n  text-transform: var(--display-case);\n  font-style: var(--display-style);' : ''
    const weight = s.fontWeight === 300 ? 'var(--font-weight-light)' : s.fontWeight
    const tracking = display ? `var(--display-tracking, ${s.letterSpacing ?? '0'})` : s.letterSpacing ?? '0'
    return `@utility type-${s.name} {\n  font-family: var(--font-${family});\n  font-size: ${s.fontSize};\n  line-height: ${s.lineHeight};\n  font-weight: ${weight};\n  letter-spacing: ${tracking};${transform}\n}`
  }))
  const colorOf = (look: string) => Object.fromEntries(t.color.tokens.map((c) => [c.name, c.value[look]]))
  const lines = (m: Record<string, string>, prefix = '') => Object.entries(m).map(([k, v]) => decl(`${prefix}${k}`, v)).join('\n')
  // what a variant scope must set so it never inherits another variant's values: the defaults, then its overrides
  const defaults = {
    ...Object.fromEntries(scalars(t.shape)),
    ...Object.fromEntries(scalars(t.duration)),
    ...Object.fromEntries(scalars(t.easing)),
  }
  const variantCss = t.variants.list.map((v) => {
    const shared = `:root[data-variant="${v.id}"], [data-variant-scope="${v.id}"]`
    const light = `:root[data-variant="${v.id}"]:not(.dark), :root:not(.dark) [data-variant-scope="${v.id}"]`
    const dark = `:root.dark[data-variant="${v.id}"], :root.dark [data-variant-scope="${v.id}"]`
    return `/* ${v.name}: ${v.signature} */
${shared} {
${lines({ ...t.type.families, ...v.families }, 'font-')}
${lines({ ...defaults, ...v.vars })}
}
${light} {
${lines({ ...colorOf('light'), ...v.light })}
  color-scheme: light;
}
${dark} {
${lines({ ...colorOf('dark'), ...v.dark })}
  color-scheme: dark;
}`
  }).join('\n')
  return `/* Generated from design-system/tokens.json by scripts/tokens.ts. Edit tokens.json, not this file. */

/* Shore (light) is the default; Deep (dark) applies only under the theme store's .dark class. */
:root {
${themed('light')}
  color-scheme: light;
}
.dark {
${themed('dark')}
  color-scheme: dark;
}
:root {
${scalars(t.shape).map(([k, v]) => decl(k, v)).join('\n')}
${scalars(t.duration).map(([k, v]) => decl(k, v)).join('\n')}
${t.layout ? scalars(t.layout).map(([k, v]) => decl(k, v)).join('\n') : ''}
}

@theme {
  --color-*: initial;
  --font-*: initial;
  --radius-*: initial;
  --shadow-*: initial;
${families.join('\n')}
${scalars(t.radius).map(([k, v]) => decl(k, v)).join('\n')}
  /* ShadCN's radius names on the system's radii: whatever holds content is square; rounded-full is the pill */
  --radius-sm: 0px;
  --radius-md: 0px;
  --radius-lg: 0px;
  --radius-xl: 0px;
  --radius-full: 999px;
${spacing.join('\n')}
${scalars(t.easing).map(([k, v]) => decl(k, v)).join('\n')}
}

/* utilities such as bg-panel, text-dim, border-line and shadow-float read the live theme variables */
@theme inline {
  --color-white: #ffffff;
  --color-black: #000000;
  --color-transparent: transparent;
${t.color.tokens.map((c) => decl(`color-${c.name}`, `var(--${c.name})`)).join('\n')}
${SHADCN.map(([k, v]) => decl(`color-${k}`, v)).join('\n')}
${t.shadow.tokens.map((x) => decl(x.name, `var(--${x.name})`)).join('\n')}
}

/* type styles: type-display, type-statement, type-title, type-figure, type-label, type-summary and the rest */
${typeUtils.join('\n')}

/* design variants: <html data-variant="…"> for the app, [data-variant-scope="…"] for one element */
${variantCss}
`
}

/** The variant list the app reads: names, notes and font queries, without the token values (those live in the CSS). */
export function buildVariantsJson(json: string): string {
  const t = JSON.parse(json) as Tokens
  return `${JSON.stringify(t.variants.list.map(({ id, name, note, signature, fonts }) => ({ id, name, note, signature, fonts })), null, 1)}\n`
}

const writeIfChanged = (path: string, text: string) => {
  let old = ''
  try { old = readFileSync(path, 'utf8') } catch { /* first run */ }
  if (old === text) return false
  writeFileSync(path, text)
  return true
}

/** Writes tokens.css and variants.json when they differ from what tokens.json makes. Returns whether it wrote. */
export function writeTokensCss(): boolean {
  const json = readFileSync(TOKENS_JSON, 'utf8')
  const css = writeIfChanged(TOKENS_CSS, buildTokensCss(json))
  const list = writeIfChanged(VARIANTS_JSON, buildVariantsJson(json))
  return css || list
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  writeTokensCss()
  console.log(`Wrote ${TOKENS_CSS}`)
}
