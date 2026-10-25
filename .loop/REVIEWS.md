# Epic #14 / OS-K1 review — 2026-10-24

Review performed by this lane, across product, customer, UX/accessibility, architecture, data/API, security/privacy, reliability, QA, estimation and adversarial lenses. This is not independent reviewer or owner approval.

Accepted local scope: source-evidenced fit-with-changes review; actual SVG rendered and visually inspected; six ordered GitHub sub-issues with two-layer contracts and estimates; KPI declarations/observation history/internal instrumentation/protected snapshot and row proof; CI regression job. EYE remains sole operator admin/analytics surface. No new customer UI or agent executor.

Measured evidence:
- All four new harness checks observed RED for absent deliverables before implementation (evidence/epic14-red-first.json).
- Existing working cn() deliberately broken: RED; original source bytes restored: GREEN (evidence/harness-mutation.json).
- SQLite replacement bypass reproduced RED, then BEFORE INSERT replacement guards and idempotent INSERT SELECT path GREEN.
- Equal-period/equal-timestamp latest reading reproduced RED, then append-sequence order GREEN.
- 26 unit/SQLite-backed tests PASS, including nine KPI tests; frontend/functions/Drizzle typechecks PASS; build PASS; new source files ESLint PASS.
- Real local Wrangler Pages + D1: auth and ordinary-business-key refusal, explicit KPI read grant, server scope, zero/NULL, stored-row proof, history refusal, foreign row refusal, unsupported writes and unavailable table contract PASS. Node 22 and Node 26 runs both PASS.
- GitHub remote bodies/titles/open states read back and match all six reviewed files; parent has actual sub-issue relations #17–#22.
- SVG screenshot opened with view_image and inspected. Proposed states and boundary legible, no clipping.

Remaining limitations / owner gates:
- Full local gate is RED: inherited lint (8 errors, 2 warnings) and malformed unchanged known-red ledger []. Neither was fixed or suppressed. M3 readiness remains BLOCKED.
- Real customer source re-derivation, approval/signer verification, EYE projection, telemetry delivery, Auth0 end-user browser session, native device builds and live deployment were not proved by these local fixtures. I could not prove this against the real system.
- Every KPI item explicitly says source_verification=not_verified. approval_ref is not a verified signature. Baselines/deltas remain EYE-owned and unimplemented here.
- Final review reproduced a real local leak to an ordinary authenticated business key (200 instead of 403). A separate explicit server-only KPI_READ_API_KEYS grant now sits after middleware authentication; its missing/undetermined state fails closed. Ordinary business keys are denied. A compromised producer can still record false business observations, which is why OS-K2 requires independent re-derivation. No public measurement write path exists.
- Runtime placement U1 (#21 / EYE #1257), signer/authority U2/U6/U7 (#20 / EYE #1253/#1258), source binding (#18) and feature catalog/manifest (#22 / EYE #1248) remain scoped blocks, posted on their issues. No business fact/config/credential guessed.
- Owner approval, real binding/identity/D1, approved discovery inputs, source-read permissions and retention policy must be determined before deployment. Do not merge/deploy as an incidental next step. No deployment/workflow dispatch performed.

Regression scope: original 17 tests still pass alongside eight new ones; shared middleware, existing items migration, provider integrations and frontend routes are unchanged. New additive migration retains items. Remote CI and an independent human code/security review remain required; a mergeable PR is not deployment or business proof.
