// @vitest-environment node
/**
 * Every runtime variable the Pages Functions read must be DECLARED in viiibin.config.json, so provisioning
 * can set and validate it per environment. An undeclared variable is one nothing prompts for and nothing
 * checks — it simply arrives empty in production and the feature is quietly dead.
 *
 * Written 2026-10-19 after `/api/notify`'s SMS path had been failing on main since 2026-09-11. The code read
 * TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN and TWILIO_FROM; none was declared; CI had been pointed at a closed
 * Twilio account for six weeks and the only signal was a check nobody read. Eight more variables were in the
 * same state, including RESEND_API_KEY — the other half of the same endpoint.
 */
import { describe, it, expect } from 'vitest'
import { readFileSync, readdirSync, statSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const FUNCTIONS = join(dirname(fileURLToPath(import.meta.url)), '..')
const ROOT = join(FUNCTIONS, '..')

/** Supplied by the platform or by a wrangler binding, never by viiibin.config.json. Each needs a reason. */
const NOT_CONFIG: Record<string, string> = {
  CF_PAGES_BRANCH: 'injected by Cloudflare Pages at build time',
  CF_PAGES_COMMIT_SHA: 'injected by Cloudflare Pages at build time',
  DB: 'a D1 binding, declared in wrangler config, not a string variable',
}

function tsFiles(dir: string): string[] {
  return readdirSync(dir).flatMap((name) => {
    const p = join(dir, name)
    if (statSync(p).isDirectory())
      return name === '__tests__' || name === 'node_modules' ? [] : tsFiles(p)
    return name.endsWith('.ts') ? [p] : []
  })
}

describe('viiibin.config.json declares what the functions read', () => {
  it('no runtime variable is undeclared', () => {
    const declared = new Set(
      Object.keys(
        JSON.parse(readFileSync(join(ROOT, 'viiibin.config.json'), 'utf8')).configVariables,
      ),
    )
    const used = new Set<string>()
    for (const f of tsFiles(FUNCTIONS)) {
      for (const m of readFileSync(f, 'utf8').matchAll(/\benv\.([A-Z][A-Z0-9_]+)/g)) used.add(m[1])
    }
    expect(
      used.size,
      'the scan found no variables at all — the regex or the path is wrong',
    ).toBeGreaterThan(5)
    const undeclared = [...used].filter((v) => !declared.has(v) && !(v in NOT_CONFIG)).sort()
    expect(
      undeclared,
      `undeclared runtime variables: ${undeclared.join(', ')} — declare them in viiibin.config.json so provisioning sets them, or add them to NOT_CONFIG with a reason`,
    ).toEqual([])
  })

  it('every NOT_CONFIG entry is actually read somewhere, so the list cannot rot', () => {
    const used = new Set<string>()
    for (const f of tsFiles(FUNCTIONS)) {
      for (const m of readFileSync(f, 'utf8').matchAll(/\benv\.([A-Z][A-Z0-9_]+)/g)) used.add(m[1])
    }
    const stale = Object.keys(NOT_CONFIG).filter((v) => !used.has(v))
    expect(stale, `NOT_CONFIG names variables nothing reads: ${stale.join(', ')}`).toEqual([])
  })
})
