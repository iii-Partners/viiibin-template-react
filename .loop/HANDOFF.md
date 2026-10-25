# HANDOFF

Epic #14, lane/iii-Partners-viiibin-template-react-14. Read KICKOFF.md, PROGRESS.md, PLAN.md and REVIEWS.md. User explicitly authorized review + child refinement + highest-value first slice; STOP BLOCKED before any deployment. Only use this worktree, never main checkout.

/preflight → /harness → /kickoff actually ran. PREFLIGHT.md exists; state/last-validate.json and artifacts/checks/*.log come from full runs; ignored ACTIVE exists (mode here). Initial missing-artifact RED and planted-fault evidence committed under evidence/.

M1 and local M2 are complete: fit-with-changes review + rendered/inspected SVG, six actual GitHub sub-issues #17–#22 under #14, two-layer contracts and three-part estimates, remote read-back; #17 KPI spine implemented (no default KPIs/no public write route). Source-backed external verification and baselines/deltas are later work, not claimed. All new KPI items explicitly say not_verified.

Latest full local gate (01:20:45Z): 7/8 check rows PASS; inherited lint has 8 errors/2 warnings; unchanged known-reds.json=[] makes the supplied ledger parser RED too. Do not weaken/fix either outside scope. 26 tests, build, frontend/functions/Drizzle types, new source lint, live GitHub contracts, drawing and real local Pages/D1 API pass. Node 22 API/SQLite parity also passes (nine KPI tests). See REVIEWS.md for limitations and replacement/ordering/service-grant falsifiers.

KPI read requires an explicit server-only KPI_READ_API_KEYS grant in addition to middleware API_KEYS authentication; ordinary business keys are denied. Real grant remains an owner-supplied deployment input, never a VITE_* variable. Fixture constants are deliberately public test constants. Base declares no real customer KPIs.

ONE draft PR: https://github.com/iii-Partners/viiibin-template-react/pull/23. GitHub reported MERGEABLE and build/delivery/kpi-contract CI passed at 8835aef, before the final service-grant fix. Read the current head's checks/mergeability and final issue comments before any later action. PR is explicitly blocked for full readiness and deployment, not approval to merge/deploy.

Next: maintainer resolves inherited M3 lint/ledger in separate work; owner reviews PR and supplies explicit M4 deployment approval plus determined real configuration/retention. Stop BLOCKED here. Human-only asks also live in ignored BLOCKED and issue comments. #18/#20/#21/#22 are scoped BLOCKED; #19 is READY for independent synthetic schema work, not dispatched. Do not continue their implementation in this lane. Final measured CI/status is recorded on #14/#17 and the PR; do not infer it from old local logs.

Commands: bash .loop/validate.sh; fast while iterating only via VALIDATE_FAST=1. API proof creates disposable synthetic local D1/Pages under state/. No live source or deployment ran: I could not prove this against the real system. GitHub needs env -u GH_TOKEN -u GITHUB_TOKEN gh to use existing working keyring. No credential installation. .wrangler is disposable ignored compile/cache output.
