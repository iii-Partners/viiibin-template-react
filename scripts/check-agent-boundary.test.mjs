// The agent-layer wall's own falsifiers (iii-eye#1247): every planted violation goes RED on a copy of this repo, and the
// repo as it is passes. Run: node --test scripts/check-agent-boundary.test.mjs
import assert from 'node:assert/strict'
import {
  cpSync,
  existsSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from 'node:fs'
import { tmpdir } from 'node:os'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { test } from 'node:test'
import { checkAgentBoundary } from './check-agent-boundary.mjs'

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..')
function copy() {
  const dir = mkdtempSync(join(tmpdir(), 'agent-boundary-'))
  for (const p of ['package.json', 'src', 'functions'])
    cpSync(join(ROOT, p), join(dir, p), { recursive: true })
  mkdirSync(join(dir, 'dist/assets'), { recursive: true })
  writeFileSync(
    join(dir, 'dist/index.html'),
    '<!doctype html><script type="module" src="/assets/index.js"></script>',
  )
  writeFileSync(join(dir, 'dist/assets/index.js'), 'const a=1;export{a};')
  return dir
}
const put = (dir, p, text) => {
  mkdirSync(dirname(join(dir, p)), { recursive: true })
  writeFileSync(join(dir, p), text)
}
const dep = (dir, section, name) => {
  const f = join(dir, 'package.json')
  const j = JSON.parse(readFileSync(f, 'utf8'))
  j[section] = { ...(j[section] || {}), [name]: '^4.0.0' }
  writeFileSync(f, JSON.stringify(j, null, 2))
}
const red = (dir, rule, why) => {
  const r = checkAgentBoundary({ root: dir, requireDist: true })
  rmSync(dir, { recursive: true, force: true })
  assert.equal(r.ok, false, 'expected RED')
  assert.ok(
    r.violations.some((v) => v.rule === rule && why.test(v.why)),
    JSON.stringify(r.violations),
  )
}

test('the repo as it is conforms', () => {
  const r = checkAgentBoundary({ root: ROOT, requireDist: existsSync(join(ROOT, 'dist')) })
  assert.deepEqual(r.violations, [])
})
test('a clean copy conforms', () => {
  const d = copy()
  const r = checkAgentBoundary({ root: d, requireDist: true })
  rmSync(d, { recursive: true, force: true })
  assert.deepEqual(r.violations, [])
})
test('RED: a planted `ai` dependency', () => {
  const d = copy()
  dep(d, 'dependencies', 'ai')
  red(d, 'dependency', /dependencies declares ai$/)
})
test('RED: a planted @ai-sdk/* devDependency', () => {
  const d = copy()
  dep(d, 'devDependencies', '@ai-sdk/openai')
  red(d, 'dependency', /@ai-sdk\/openai/)
})
test("RED: import { streamText } from 'ai' in a shipped module", () => {
  const d = copy()
  put(d, 'src/lib/chat.ts', "import { streamText } from 'ai'\nexport const s = streamText\n")
  red(d, 'import', /imports ai$/)
})
test('RED: a dynamic import of an @ai-sdk provider in a Pages Function', () => {
  const d = copy()
  put(
    d,
    'functions/api/chat.ts',
    "export const onRequest = async () => { const { openai } = await import('@ai-sdk/openai'); return new Response(String(openai)) }\n",
  )
  red(d, 'import', /@ai-sdk\/openai/)
})
test("RED: require('ai/rsc') in a shipped module", () => {
  const d = copy()
  put(d, 'src/lib/rsc.js', "const x = require('ai/rsc')\nmodule.exports = x\n")
  red(d, 'import', /ai\/rsc/)
})
test('RED: the SDK inlined into the built bundle (vercel.ai.error marker)', () => {
  const d = copy()
  put(d, 'dist/assets/vendor.js', 'var m="vercel.ai.error",s=Symbol.for(m);export{s};')
  red(d, 'bundle', /vercel\.ai\.error/)
})
test('RED: no built bundle to inspect when the bundle is required', () => {
  const d = copy()
  rmSync(join(d, 'dist'), { recursive: true, force: true })
  red(d, 'bundle', /no built dist/)
})
test('RED: a planted prompt-editor route', () => {
  const d = copy()
  put(
    d,
    'src/app/routes/agent.tsx',
    "import { PromptEditor } from '@/components/agent/prompt-editor'\nexport default function AgentRoute() { return <PromptEditor /> }\n",
  )
  red(d, 'authoring', /PromptEditor/)
})
test('RED: a system prompt field on a page', () => {
  const d = copy()
  put(
    d,
    'src/app/routes/assistant.tsx',
    'export default function A() { return <label>System prompt<textarea name="instructions" /></label> }\n',
  )
  red(d, 'authoring', /System prompt/)
})
test('RED: a tool editor component', () => {
  const d = copy()
  put(
    d,
    'src/components/tools/tool-editor.tsx',
    'export function ToolEditor() { return <form /> }\n',
  )
  red(d, 'authoring', /ToolEditor/)
})
test('RED: anything marked data-agent-authoring', () => {
  const d = copy()
  put(d, 'src/components/x.tsx', 'export const X = () => <div data-agent-authoring />\n')
  red(d, 'authoring', /data-agent-authoring/)
})
test('not RED: lookalikes (airtable, aim, a prompt toast, an @ai-sdk word in a test)', () => {
  const d = copy()
  put(
    d,
    'src/lib/near.ts',
    "import Airtable from 'airtable'\nexport const aim = 'prompt the user'; export const t = Airtable\n",
  )
  put(d, 'src/__tests__/sdk.test.ts', "import { streamText } from 'ai'\n")
  const r = checkAgentBoundary({ root: d, requireDist: true })
  rmSync(d, { recursive: true, force: true })
  assert.deepEqual(r.violations, [])
})
