#!/usr/bin/env node
// .loop/lib/known-reds.mjs (iii-eye#1012, ported from iii-Partners/iii-partners-local-fleet at 6a3fe50, its #161/#179): the verdict of a validate.sh run, judged against .loop/known-reds.json.
// Called by finish() in check.sh after it writes .loop/state/last-validate.json. Exit 0 ONLY when every red is a
// ledgered, unexpired standing finding whose issue is open on GitHub. Prints two blocks — NEW RED (the alarm) and
// KNOWN RED (the standing findings) — and a summary that always states the known-red count, so a run carrying
// standing reds can never print as a clean green.
//
// The ledger records reds; it never removes them. Every check still runs and still prints FAIL; this only decides
// whether a FAIL is news. There is no env var or flag that changes the verdict, and the 31-day cap is code, not data.
//
// iii-eye's differences from local-fleet's file, each forced by iii-eye's own harness and nothing else:
//  - iii-eye's check() has no SKIP status, so last-validate.json carries no "skipped" count; it is read as 0.
//  - In CI and Deploy EYE the issue lookups' token arrives as KNOWN_REDS_TOKEN and is handed to the gh child alone (the
//    #951 pattern), so no other check in the gate sees a GitHub token it did not have. It is a credential, not a switch:
//    without it gh cannot answer, every entry is refused by name and the run is RED.
import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { execFileSync } from 'node:child_process';

const LEDGER = '.loop/known-reds.json';
const STATE = '.loop/state/last-validate.json';
const MAX_DAYS = 31;
const DAY = 86400000;

const run = JSON.parse(readFileSync(STATE, 'utf8'));
run.skipped = run.skipped || 0; // iii-eye: no SKIP status in check.sh
const ghEnv = process.env.KNOWN_REDS_TOKEN ? { ...process.env, GH_TOKEN: process.env.KNOWN_REDS_TOKEN } : process.env;
const today = new Date().toISOString().slice(0, 10);
const declared = new Set([...readFileSync('.loop/validate.sh', 'utf8').matchAll(/^\s*check\s+(\S+)\s/gm)].map((m) => m[1]));
const status = new Map(run.checks.map((c) => [c.id, c.status]));

const newRed = [];    // {id, text} — each makes the run non-zero
const known = [];     // accepted entries whose check FAILED
const notRun = [];    // accepted entries whose check did not run in this layer
const skipped = [];   // accepted entries whose check SKIPped (named prerequisite)
let ledgerError = null;

let entries = [];
let repo = null;
if (existsSync(LEDGER)) {
  try {
    const l = JSON.parse(readFileSync(LEDGER, 'utf8'));
    if (!l || !Array.isArray(l.entries)) throw new Error('no "entries" array');
    if (typeof l.repo !== 'string' || !/^[\w.-]+\/[\w.-]+$/.test(l.repo)) throw new Error('no "repo" (owner/name) for a bare #N issue');
    entries = l.entries; repo = l.repo;
  } catch (e) {
    ledgerError = `${LEDGER} cannot be read: ${e.message} — every red is NEW until it parses`;
  }
}

const issueCache = new Map();
function issueState(ref) { // -> {ok:true} | {why}
  const m = /^(?:([\w.-]+\/[\w.-]+))?#(\d+)$/.exec(String(ref).trim());
  if (!m) return { why: `issue "${ref}" is not #N or owner/repo#N` };
  const slug = `${m[1] || repo}#${m[2]}`;
  if (issueCache.has(slug)) return issueCache.get(slug);
  let r;
  try {
    const out = execFileSync('gh', ['api', `repos/${m[1] || repo}/issues/${m[2]}`, '--jq', '[.state, (.pull_request != null)] | @tsv'],
      { encoding: 'utf8', timeout: 20000, stdio: ['ignore', 'pipe', 'pipe'], env: ghEnv }).trim();
    const [state, isPr] = out.split('\t');
    if (isPr === 'true') r = { why: `${ref} is a pull request, not an issue` };
    else if (state !== 'open') r = { why: `${ref} is ${state} — a closed issue owns no finding; reopen it or file one that does` };
    else r = { ok: true };
  } catch (e) {
    const err = String(e.stderr || e.message);
    r = /Not Found|HTTP 404|HTTP 410/.test(err) ? { why: `${ref} does not exist` }
      : { why: `${ref} could not be verified on GitHub (${err.split('\n')[0].slice(0, 80)})` };
  }
  issueCache.set(slug, r);
  return r;
}

function refuse(e) { // -> reason string or null
  if (!e || typeof e !== 'object') return 'not an object';
  for (const f of ['check', 'owner', 'why']) if (typeof e[f] !== 'string' || !e[f].trim()) return `no ${f}`;
  if (e.issue === undefined || e.issue === null || String(e.issue).trim() === '') return 'no issue — no issue, no suppression';
  if (!declared.has(e.check)) return 'no such check in .loop/validate.sh';
  if (e.expires === undefined || e.expires === null || e.expires === '') return 'no expires — no entry may be open-ended';
  if (!/^\d{4}-\d{2}-\d{2}$/.test(e.expires) || Number.isNaN(Date.parse(e.expires))) return `expires "${e.expires}" is not YYYY-MM-DD`;
  if ((Date.parse(e.expires) - Date.parse(today)) / DAY > MAX_DAYS) return `expires ${e.expires} is more than ${MAX_DAYS} days out — renew it, do not park it`;
  const is = issueState(e.issue);
  return is.ok ? null : is.why;
}

const accepted = new Map();
const seen = new Set();
for (const e of entries) {
  const id = e && typeof e.check === 'string' && e.check ? e.check : '(entry with no check)';
  if (seen.has(id)) { newRed.push({ id, text: 'refused ledger entry: duplicate — one entry per check' }); continue; }
  seen.add(id);
  const why = refuse(e);
  if (why) {
    // a refused entry suppresses nothing; its check, if red, is reported once, here
    const st = status.get(id);
    newRed.push({ id, text: `refused ledger entry: ${why}${st === 'fail' ? ' — and the check is RED' : ''}` });
    continue;
  }
  accepted.set(id, e);
}

for (const c of run.checks) {
  const e = accepted.get(c.id);
  if (c.status === 'fail') {
    if (newRed.some((n) => n.id === c.id)) continue;
    if (!e) newRed.push({ id: c.id, text: 'not in the ledger' });
    else if (e.expires < today) newRed.push({ id: c.id, text: `ledger entry expired ${e.expires} — owner ${e.owner}, ${e.issue}: renew it with a reason or fix the check` });
    else known.push(e);
  } else if (e && c.status === 'pass') {
    newRed.push({ id: c.id, text: `stale ledger entry: it PASSED — remove it from ${LEDGER} (owner ${e.owner}, ${e.issue})` });
  } else if (e && c.status === 'skip') {
    skipped.push(e);
  }
}
for (const [id, e] of accepted) if (!status.has(id)) notRun.push(e);

const pad = (s) => s.padEnd(30);
if (known.length) {
  console.log(`KNOWN RED (${known.length} standing — each has an issue, an owner and an expiry; NOT a pass):`);
  for (const e of known) console.log(`  ${pad(e.check)} ${e.issue}  owner ${e.owner}  expires ${e.expires} — ${e.why}`);
  console.log('');
}
if (skipped.length || notRun.length) {
  console.log('LEDGERED, NOT JUDGED IN THIS RUN:');
  for (const e of skipped) console.log(`  ${pad(e.check)} ${e.issue}  SKIP — could not be judged here (expires ${e.expires})`);
  for (const e of notRun) console.log(`  ${pad(e.check)} ${e.issue}  not run in this layer (expires ${e.expires})`);
  console.log('');
}
if (ledgerError) newRed.unshift({ id: 'known-reds.json', text: ledgerError });
if (newRed.length) {
  console.log(`NEW RED (${newRed.length} — the alarm):`);
  for (const n of newRed) console.log(`  ${pad(n.id)} ${n.text}`);
  console.log('');
}

const total = run.passed + run.failed + run.skipped;
const oldest = known.map((e) => e.expires).sort()[0];
const kr = `${known.length} known red${known.length === 1 ? '' : 's'}${oldest ? ` (oldest expires ${oldest})` : ''}`;
const unjudged = notRun.length ? ` in this layer (${notRun.length} ledgered check${notRun.length === 1 ? '' : 's'} not run here)` : '';
const ok = newRed.length === 0;

run.pass = ok;
run.new_red = newRed.map((n) => n.id);
run.known_red = known.map((e) => e.check);
run.ledgered_not_judged = [...skipped, ...notRun].map((e) => e.check);
writeFileSync(STATE, JSON.stringify(run) + '\n');

console.log('----');
if (run.skipped > 0) console.log(`SKIPPED (${run.skipped}, each named its missing prerequisite): ${run.checks.filter((c) => c.status === 'skip').map((c) => c.id).join(' ')}`);
if (ok) {
  console.log(`HARNESS GREEN with ${kr}${unjudged}: ${run.passed}/${total} passed, ${run.skipped} not applicable on this host, ${run.failed} failed, 0 new red`);
  process.exit(0);
}
console.log(`HARNESS RED: ${newRed.length} new red: ${run.new_red.join(' ')}; ${kr}${unjudged}; ${run.passed}/${total} passed`);
process.exit(1);
