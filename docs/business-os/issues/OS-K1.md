## Customer product contract
**Parent:** #14 · **Capability:** OS-K1 · **Status:** READY for local implementation; BLOCKED for deployment

**Problem:** Discovery names business measures but the base template cannot preserve their meaning or source-backed observations.

**Desired outcome / user story:** As a business operator, the operator can eventually read their agreed measures in EYE, follow a stored observation to its record, and distinguish zero from missing or stale data.

**User journey:** An approved discovery declaration is delivered by iii; trusted source instrumentation appends an observation; EYE service reads it. No customer writes a metric or uses a template admin screen.

**Business rules:** Empty defaults contain no customer facts. Stable keys cannot change unit/category/direction. Observations and definition history are append-only. A reference string is not a verified approval/signature. EYE alone owns signed baselines and impact deltas.

**Visual example / states:** [Control surface SVG](https://github.com/iii-Partners/viiibin-template-react/blob/lane/iii-Partners-viiibin-template-react-14/docs/business-os/control-surface.svg). EYE alone hosts operator UI; stakeholder apps stay in the OS. Loading is pending, absence is unmeasured, failure is unavailable, success includes a source witness. No fixture represents a customer or revenue.

**Observable acceptance criteria → verification:**
1. **Given** a declaration but no reading, **When** the service reads the KPI, **Then** Unmeasured and null are returned, never zero. Verification: `os-kpi-contract: empty/null/zero/stale`.
2. **Given** two isolated venture bindings and a stored observation id, **When** a service requests a snapshot or row proof, **Then** only the server-bound venture is returned; caller-selected scope and end-user reads are refused. Verification: `os-kpi-api + os-kpi-contract: scope/auth`.
3. **Given** a repeated instrumentation event or direct history mutation, **When** it is submitted again or SQL attempts UPDATE/DELETE, **Then** exact retry is idempotent, changed replay fails, and history cannot be mutated. Verification: `os-kpi-contract: replay + database triggers`.

## Engineering execution contract
**Architecture / scope:** Add functions/_lib/kpis.ts, functions/api/kpis.ts, additive db/migrations/0001_kpi_spine.sql and matching Drizzle entities. Internal declareKpi/recordKpiObservation helpers accept closed schemas; no HTTP mutation handler. GET /api/kpis and ?observation_id=<id> are machine-only behind real Pages middleware.

**Data / APIs:** kpi-definition/v1: key/version/label/unit/category/direction/discovery_ref/approval_ref/source_ref/max_age_seconds. Observation: stable id + exact definition version + finite number or null/reason + ordered UTC period + opaque source_ref. Composite venture keys and foreign key. business-os-kpis/v1 is a local observation contract, not client-kpi/v1.

**Security / inputs:** VENTURE_ID comes only from server config. Require both real Pages machine authentication through API_KEYS and a separate explicit KPI_READ_API_KEYS read grant for EYE. Ordinary business keys, user identities and scope overrides are refused. Missing/undetermined read grant fails 503. The server-only grant must be declared in provisioning and must never enter VITE_* client variables. Opaque operational references only, no PHI or free-form notes. No-store on handler responses. Missing binding/storage/unreadable source = 503, never empty success; unknown row = 404; writes = 405.

**Dependencies / dedupe:** No implementation predecessor; reuse #5 identity, #8/#11 telemetry semantics and #14 fit review. Existing EYE #1248/#1254/#1251 own project/manifest/UI. PR #16 owns SDK wall. Local capability predecessors: none.

**Tests / falsifiers:** Run functions/__tests__/kpis.test.ts against real SQLite and .loop/harness/kpi-api.mjs against real isolated local Pages/D1. Seed two explicitly synthetic ventures. Cover period ordering, new definition versions, exact retry/conflict, source missingness, storage failure and immutability. Render/inspect the boundary SVG. No real-system claim from local fixtures. Each acceptance scenario maps above to its required automated check. See the parent review for UX/accessibility, architecture diagrams, data ER, risk and negative-test matrix. Checks must be seen RED before GREEN; references to future check ids are obligations, not claims they ran.

**Observability:** Return explicit measured/unmeasured/stale states, definition version, period and stored-row proof reference. Sanitize infrastructure errors; no secret/value logging. Do not emit an event called delivered or verified merely because a row was accepted.

**Rollout / rollback:** Local implementation only. Empty base has no declarations. Activation requires approved discovery inputs, real project binding/identity/D1, retention decision and explicit owner deployment approval. Roll back consumers/code, retain append-only history.

**Regression guards:** Existing auth/API/MCP behavior (#5), telemetry acceptance-vs-delivery (#8/#11), item schema and frontend shell are guarded by npm test, build, functions typecheck and real Pages middleware checks. Outbound provider proof (#7/#12) is not claimed from absent credentials. Any confirmed regression links its cause PR/lane and named test.

**Definition of done:** implemented/reviewed/documented; relevant checks seen RED then GREEN; SVG updated and inspected if boundaries change; recorded source-row proof; no unlinked regressions; **does not break linked/dependent work**. ONE PR per delivery slice. Production acceptance requires owner-approved deployment and real read-back, or state exactly: **I could not prove this against the real system.** A local fixture is not customer proof. No deployment before owner approval.

**Estimate — recorded before this child is built:**
- **AI tokens:** 55,000.
- **AI clock time:** 60 minutes (active lane, excludes human waiting).
- **Human time with AI:** 15 minutes (policy/technical review and approval).
- **Cost:** `cost_usd: null`; `cost_basis: unknown`; `cost_reason: exact usage and subscription allocation unavailable`. Never sum cost bases.
- **Confidence / assumptions:** medium-low; synthetic local inputs and existing template tooling; external owner decisions, production credentials, deployment and source proof excluded from allowance. Record measured actuals and variance on completion; do not infer tokens or cost from changed lines.
