#!/usr/bin/env node
// The agent-layer wall (iii-eye#1247, CO-3). The Vercel AI SDK and raw agent authoring stay iii-side: nothing this
// template delivers to a customer may contain them. Fails when
//   1. package.json declares `ai` or any `@ai-sdk/*` package (any dependency section);
//   2. a shipped source file (src/**, functions/**) imports one (import/export from, import(), require());
//   3. the built bundle (dist/**) carries one: an unbundled specifier, an `@ai-sdk/` path or the SDK's
//      `vercel.ai.error` marker — so a bundler inlining the package cannot hide it;
//   4. a route-reachable UI file (src/**) renders an agent-authoring control: a prompt editor, a system prompt field,
//      a tool editor/definition/schema builder, an agent builder/instructions editor, or anything marked
//      data-agent-authoring. Agent authoring is iii-internal by definition (EYE's governed builder), never a customer page.
// Tests (*.test.*, __tests__/) are not shipped and are not scanned. Zero dependencies.
// Run: node scripts/check-agent-boundary.mjs [--root <dir>] [--require-dist] [--json]
// EYE reads this check's result on main as the settings-conformance row `agent-boundary · <repo>` (domain agent-boundary).
import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs'
import { join, relative, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const SDK_PACKAGE = /^(ai|@ai-sdk\/[^/]+)$/
const SDK_SPECIFIER =
  /(?:\bfrom\s*|\bimport\s*\(\s*|\brequire\s*\(\s*|^\s*import\s+)(['"`])(ai(?:\/[^'"`]*)?|@ai-sdk\/[^'"`]+)\1/m
const BUNDLE_MARKERS = [
  { re: /vercel\.ai\.error/, why: "the Vercel AI SDK's vercel.ai.error marker" },
  { re: /@ai-sdk\//, why: 'an @ai-sdk/ module path' },
]
const AUTHORING =
  /\b(system[\s_-]?prompts?|prompt[\s_-]?(?:editor|builder|template|playground)s?|tool[\s_-]?(?:editor|definition|schema|builder)s?|agent[\s_-]?(?:builder|authoring|editor|instructions)|data-agent-authoring)\b/i
const SOURCE_EXT = /\.(?:[cm]?[jt]sx?)$/
const BUNDLE_EXT = /\.(?:[cm]?js|html)$/
const isTest = (p) => /(^|\/)__tests__\//.test(p) || /\.(test|spec)\.[cm]?[jt]sx?$/.test(p)

function walk(dir, keep, out = []) {
  if (!existsSync(dir)) return out
  for (const name of readdirSync(dir)) {
    if (name === 'node_modules' || name.startsWith('.')) continue
    const p = join(dir, name)
    if (statSync(p).isDirectory()) walk(p, keep, out)
    else if (keep(p)) out.push(p)
  }
  return out
}
const lineOf = (text, index) => text.slice(0, index).split('\n').length

export function checkAgentBoundary({ root, requireDist = false }) {
  const violations = []
  const add = (rule, file, line, why) =>
    violations.push({ rule, file: relative(root, file) || file, line, why })
  // 1 · declarations
  const pkgFile = join(root, 'package.json')
  const pkg = JSON.parse(readFileSync(pkgFile, 'utf8'))
  for (const section of [
    'dependencies',
    'devDependencies',
    'peerDependencies',
    'optionalDependencies',
  ]) {
    for (const name of Object.keys(pkg[section] || {}))
      if (SDK_PACKAGE.test(name)) add('dependency', pkgFile, null, `${section} declares ${name}`)
  }
  // 2 · shipped source imports
  for (const dir of ['src', 'functions']) {
    for (const f of walk(
      join(root, dir),
      (p) => SOURCE_EXT.test(p) && !isTest(relative(root, p)),
    )) {
      const text = readFileSync(f, 'utf8')
      const re = new RegExp(SDK_SPECIFIER.source, 'gm')
      for (let m; (m = re.exec(text));) add('import', f, lineOf(text, m.index), `imports ${m[2]}`)
    }
  }
  // 3 · the built bundle
  const dist = join(root, 'dist')
  if (!existsSync(dist)) {
    if (requireDist) add('bundle', dist, null, 'no built dist/ to inspect (run the build first)')
  } else
    for (const f of walk(dist, (p) => BUNDLE_EXT.test(p))) {
      const text = readFileSync(f, 'utf8')
      const m = new RegExp(SDK_SPECIFIER.source, 'm').exec(text)
      if (m) add('bundle', f, lineOf(text, m.index), `the bundle imports ${m[2]}`)
      for (const k of BUNDLE_MARKERS) {
        const x = k.re.exec(text)
        if (x) add('bundle', f, lineOf(text, x.index), `the bundle carries ${k.why}`)
      }
    }
  // 4 · agent-authoring controls in route-reachable UI
  for (const f of walk(
    join(root, 'src'),
    (p) => SOURCE_EXT.test(p) && !isTest(relative(root, p)),
  )) {
    const text = readFileSync(f, 'utf8')
    const re = new RegExp(AUTHORING.source, 'gi')
    for (let m; (m = re.exec(text));)
      add('authoring', f, lineOf(text, m.index), `renders an agent-authoring control ("${m[1]}")`)
  }
  return { ok: violations.length === 0, violations }
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const args = process.argv.slice(2)
  const at = args.indexOf('--root')
  const root = resolve(at >= 0 ? args[at + 1] : join(fileURLToPath(import.meta.url), '..', '..'))
  const r = checkAgentBoundary({ root, requireDist: args.includes('--require-dist') })
  if (args.includes('--json')) console.log(JSON.stringify(r, null, 2))
  else if (r.ok)
    console.log(
      'agent-boundary: conform — no ai / @ai-sdk/* package, import or bundle marker, and no agent-authoring control',
    )
  else {
    for (const v of r.violations) {
      const where = v.file + (v.line ? ':' + v.line : '')
      console.error(`${where}: [${v.rule}] ${v.why}`)
      if (process.env.GITHUB_ACTIONS)
        console.log(
          `::error file=${v.file}${v.line ? ',line=' + v.line : ''},title=agent-boundary::${v.why}`,
        )
    }
    console.error(
      `agent-boundary: deviation — ${r.violations.length} violation(s). The Vercel AI SDK and agent authoring are iii-side only (iii-eye#1247).`,
    )
  }
  process.exit(r.ok ? 0 : 1)
}
