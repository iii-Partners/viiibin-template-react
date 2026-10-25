import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { execFileSync } from 'node:child_process'

const env = { ...process.env }
delete env.GH_TOKEN
delete env.GITHUB_TOKEN
const plan = JSON.parse(readFileSync('docs/business-os/issues.json', 'utf8'))
assert.equal(plan.epic, 14)
assert.equal(plan.children.length, 6)
const keys = new Set()
const numbers = new Set()
for (const item of plan.children) {
  assert(!keys.has(item.key), `duplicate capability ${item.key}`)
  assert(!numbers.has(item.number), `duplicate issue ${item.number}`)
  for (const dep of item.depends_on) assert(keys.has(dep), `${item.key} dependency out of order: ${dep}`)
  keys.add(item.key)
  numbers.add(item.number)
  const body = readFileSync(`docs/business-os/issues/${item.key}.md`, 'utf8')
  for (const phrase of ['Customer product contract', 'Engineering execution contract', 'Given', 'When', 'Then',
    'AI tokens', 'AI clock time', 'Human time with AI', 'cost_usd', 'cost_basis', 'cost_reason',
    'Confidence', 'Regression', 'does not break linked/dependent work', 'Definition of done']) {
    assert(body.includes(phrase), `${item.key} lacks ${phrase}`)
  }
  assert.equal(item.estimate.cost_usd, null)
  assert.equal(item.estimate.cost_basis, 'unknown')
  for (const k of ['tokens', 'wall_clock_s', 'human_minutes']) assert(item.estimate[k] > 0)
  if (process.argv.includes('--live')) {
    const remote = JSON.parse(execFileSync('gh', ['issue', 'view', String(item.number), '--repo', plan.repo,
      '--json', 'title,body,state'], { encoding: 'utf8', env, timeout: 20000 }))
    assert.equal(remote.title, item.title)
    assert.equal(remote.body.trim(), body.trim(), `${item.key} live body differs from reviewed contract`)
    assert.equal(remote.state, 'OPEN')
  }
}
if (process.argv.includes('--live')) {
  const epic = JSON.parse(execFileSync('gh', ['issue', 'view', '14', '--repo', plan.repo,
    '--json', 'body'], { encoding: 'utf8', env, timeout: 20000 }))
  let index = -1
  for (const item of plan.children) {
    const next = epic.body.indexOf(`issues/${item.number}`)
    assert(next > index, `epic missing/out-of-order ${item.key}`)
    index = next
  }
}
console.log('PASS: six ordered, deduplicated two-layer issue contracts with estimates' +
  (process.argv.includes('--live') ? '; all re-read from GitHub' : ''))
