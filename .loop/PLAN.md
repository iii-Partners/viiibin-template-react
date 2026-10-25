# PLAN

## North star
Discovery-defined business KPIs become source-backed, tenant-bound measurements in each delivered OS. EYE is the only customer operator/admin/analytics surface. Delivered agents run within GOVENANT authority; authoring and engineering stay iii-side.

This lane reviews the base, refines and deduplicates delivery issues, and implements the highest-value independent first slice. The user's 2026-10-24 instruction explicitly adds implementation to the original analysis-only issue. Never deploy: stop BLOCKED on owner approval.

## Reference
- Epic: https://github.com/iii-Partners/viiibin-template-react/issues/14
- Engineering standard: https://github.com/iii-Partners/iii-commands/blob/05c6a9b70ddd38f5bd4a65c27936dac08c7a4fcd/docs/iii-engineering-delivery-standard.md
- EYE surface ownership: iii-eye#1230, #1248–#1258, #1263.
- Canonical measurement: iii-eye/contracts/schemas/client-kpi.v1.schema.json. EYE owns countersigned baselines and deltas; this template slice does not create either.
- GOVENANT reference: app.iii.partners constitution.ts, capability-matrix-gate.ts, decision-ledger immutability migration. Its motion_tier is animation, not agent autonomy.

## Milestones
- [ ] M1 (#14) Review fit with file evidence, draw boundaries, and file dependency-ordered children with two-layer contracts and three-part estimates; read them back and dedupe.
- [ ] M2 (first child of #14) Build the KPI declaration + append-only observation spine and protected read surface. Observe each new check RED before GREEN, including a planted working-feature fault.
- [ ] M3 (#14) Review/test/document the slice, commit in this lane, and open ONE reviewable PR with mergeability checked. Inherited failures remain visible and block full readiness.
- [ ] M4 (#14) Owner-approved deployment + production source read-back. BLOCKED: explicit owner approval and determined project configuration required; do not execute in this lane.

## What the user sees
The customer's existing stakeholder web/mobile app stays their product. No second admin UI. A future EYE connector reads declared metrics and actual observations, with source references, or explicit unmeasured/unavailable states. The first slice is a service contract, not a new screen. A real SVG in docs illustrates the future EYE reading and substrate boundary; it is not a deployed UI.

## First-slice acceptance
1. Distinct discovery declarations validate into a closed versioned schema with stable keys, unit/category/direction, source/read-back reference, cadence, and approval reference. Missing/undetermined declarations fail by name; defaults contain no client KPIs.
2. Instrumentation appends observations bound to the server's VENTURE_ID. Exact retry is idempotent; conflicting replay and unit/definition changes fail. Updates/deletes to observation/definition history are prevented by database triggers.
3. GET /api/kpis is limited to authenticated machine callers, binds scope on the server, and never accepts a caller-selected venture. No reading is null/unmeasured, never zero; unreadable storage is unavailable, never empty success. No baselines, deltas, or claims of verified external source delivery.
4. Real local Pages Functions + D1 contract tests exercise auth, two scoped fixtures, null/zero, replay, immutability, and read-back. No external customer or PHI data.

## Inputs required
| input | source / determination | scope |
|---|---|---|
| repo / branch | supplied worktree, lane/iii-Partners-viiibin-template-react-14 | all changes/commits here |
| GitHub access | existing keyring works; inherited GH_TOKEN invalid, unset only per gh invocation | issue authoring, ONE PR |
| Node/npm and dependencies | verify installed package graph; use existing lock | local build/proof |
| Workers/D1 + browser tooling | local Wrangler; synthetic fixture constants; Chromium cache | local proof only |
| KPI facts | no live facts supplied; empty base registry; synthetic fixtures explicitly named | real deployment BLOCKED until owner supplies approved discovery declaration and read-back |
| VENTURE_ID / service credentials / D1 binding | synthetic constants in isolated harness; real values undetermined | deployment BLOCKED, never guess |
| agent execution location, authority tiers/write levers | owner U1/U6/U7 on iii-eye#1257/#1258 | later runtime/admin tickets BLOCKED |
| deployment approval | owner, after reviewing concrete PR | M4 BLOCKED |

## Harness plan
Use .loop/lib/check.sh unchanged and finish; preserve inherited lint/build/typecheck/test behavior and known-red ledger interpretation. Per-check logs and last-validate.json are required.
- base-lint, base-typecheck, base-build, base-tests: regression baseline (M2/M3).
- os-kpi-contract: declaration, instrumentation, persistence and negative unit/SQL checks (M2).
- os-kpi-api: real isolated Wrangler Pages + D1 read contract, auth/scope/unavailable checks (M2).
- os-issue-contracts: validate/read back authored GitHub issue contracts (M1).
- os-drawing: render SVG and capture/read its browser screenshot (M1).
VALIDATE_FAST=1 omits only the build and live GitHub/API/browser layer while iterating; full run required for acceptance. Existing unrelated REDs are not fixed or weakened. Record them under scoped .loop/BLOCKED entries and on #14.

## Forward estimate (recorded before implementation)
This lane: 110,000 AI tokens; 110 minutes AI clock; 25 minutes human review/approval. Medium-low confidence: first-ever template KPI slice, inherited gate faults and external schema alignment. cost_usd: null; cost_basis: unknown; cost_reason: subscription allocation and provider usage unavailable. No $0 claim; no mixed cost-basis totals. Discovery already performed is not misrepresented as pre-estimated. Child work estimates will be written before each child's implementation.

## Non-goals / limits
No customer administration in the template; no SDK authoring; no agent executor before U1; no live customer facts/baselines invented; no telemetry delivery claim without real query/read-back; no deployment or workflow dispatch. EYE UI issues remain in EYE and are linked, not duplicated.
