# KICKOFF

Mode: **here**. User requested /preflight → /harness → /kickoff, local first slice, and STOP before any deploy. This instruction is the deployment wall, not a request to deploy.

## North star and done
Discovery-defined business KPIs become source-backed, tenant-bound measurements in each delivered OS. EYE is the only customer operator/admin/analytics surface. Delivered agents run within GOVENANT authority; authoring and engineering stay iii-side.
Full done requires .loop/validate.sh exit 0 and every PLAN checkbox checked. A recorded BLOCKED entry is a reason to stop a dependent milestone, not a passing gate or completed epic. Never claim DEPLOYED from a local build. This lane must stop BLOCKED before M4 and on inherited M3 gates, after finishing independent M1/M2 work and making one concrete PR.

## Where things are
- Worktree: supplied iii-Partners-viiibin-template-react-14; branch lane/iii-Partners-viiibin-template-react-14. Main checkout is read-only to this lane.
- PLAN.md: milestones, acceptance, inputs, estimate. PROGRESS.md: append dated evidence and harness justifications. HANDOFF.md: cold-resume entry. REVIEWS.md: final adversarial review when available.
- validate.sh: single gate. harness/: source of checks. evidence/: committed RED/mutation summaries. artifacts/checks/: logs; artifacts/screenshots/: browser captures; state/last-validate.json: measured verdict. config.sh: inherited loop limits.
- Start app: npm run dev on 5173 (stakeholder UI). Real backend: Wrangler Pages Functions/D1; harness/kpi-api.mjs manages its own local random port and disposable D1. Vite's sandbox D1 shim bypasses middleware, so it is NOT proof of backend auth.
- Run full bash .loop/validate.sh; VALIDATE_FAST=1 bash .loop/validate.sh only while iterating.

## Loop protocol
1. Read HANDOFF, PROGRESS, git log --oneline -15, and state/last-validate.json.
2. Pick next unchecked independent milestone/red check. M1 review + six deduplicated children precedes M2 implementation; author child estimates before code.
3. Implement in small steps; commit each stable step and about every 400 changed lines. Tests are already RED on missing code/doc artifacts.
4. Run fast checks while iterating and the complete gate before acceptance. Preserve all inherited checks.
5. Open screenshots touched by the milestone and inspect them. A render/assertion alone is not visual inspection.
6. When acceptance passes, check off its milestone, append dated measured evidence, commit. Never mark the whole epic done while later implementation or deployment remains.
7. Continue independent work without confirmation; block only the dependent work. Update HANDOFF before context gets heavy.

## Rules and gotchas
- No shortcuts/stubs/hard-coded success; no weakened/deleted checks. Log justified harness repairs under Harness changes.
- Never print secrets or write credentials; use synthetic test constants only. Never run install-agent.sh or edit a sealed/append-only record. No PHI writes or exports. demo is not customer/revenue; spell Claravida correctly.
- Keep customer admin/analytics/approvals in EYE. Template exposes stakeholder product surfaces and protected service contracts only. No SDK authoring UI or agent executor until owner U1 is resolved on iii-eye#1257; U6/U7 remain on #1258.
- A reference is not verified approval and an observation is not verified impact. Do not invent countersigned baselines, deltas, source proof, or customer facts.
- GitHub CLI: env -u GH_TOKEN -u GITHUB_TOKEN gh ... uses working keyring. For npm git dependencies use invocation-scoped HTTPS→SSH rewrite with BatchMode; do not change global config or credentials.
- Existing base-lint RED (8 errors/2 warnings) and malformed known-red ledger [] are outside this ticket. Preserve and report; do not change ledger or fix unrelated source.
- Missing human input: write exact ask under ## <milestone> (#<issue>) — <ask> in .loop/BLOCKED AND comment BLOCKED on that issue. Continue everything it does not block.
- Readiness measured 2026-10-25T00:54:16Z: full gate runs, base-build passes; missing M1/M2 deliverables red as expected. Working tree committed; PREFLIGHT has no ❌ for local scope.
