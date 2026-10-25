## Customer product contract
**Parent:** #14 · **Capability:** OS-G3 · **Status:** BLOCKED — owner determines runtime hosting U1 on EYE #1257

**Problem:** The template has no agent executor; declaring agents always on would currently be unmeasured.

**Desired outcome / user story:** As a business operator, delivered business agents run within their grants, honor governed pause controls, and show a truthful last-seen/failed/stopped state in EYE.

**User journey:** A versioned definition is scheduled or triggered; runtime loads approved context/tools, passes each act through the action door, records an outcome/read-back, and reports liveness. EYE pause blocks the next effect.

**Business rules:** Authoring remains iii-side. No raw Vercel AI SDK in customer-deployed artifact; reuse PR #16 wall. Only explicitly granted tools/context; no direct cross-agent calls. Missing lease/heartbeat produces an alarm, never healthy. Pause must be re-read before any irreversible effect.

**Visual example / states:** [Control surface SVG](https://github.com/iii-Partners/viiibin-template-react/blob/lane/iii-Partners-viiibin-template-react-14/docs/business-os/control-surface.svg). EYE alone hosts operator UI; stakeholder apps stay in the OS. Loading is pending, absence is unmeasured, failure is unavailable, success includes a source witness. No fixture represents a customer or revenue.

**Observable acceptance criteria → verification:**
1. **Given** a delivered definition and ratified execution location, **When** a scheduled run executes, **Then** only granted tools run and its outcome/usage/receipt are source-readable. Verification: `os-runtime bounded-tools integration`.
2. **Given** an EYE pause or authority change, **When** a running agent reaches the next effect, **Then** it re-reads policy and stops before the effect. Verification: `os-runtime pause/revocation mutation`.
3. **Given** a dead worker or failed source, **When** heartbeat/measurement is due, **Then** EYE receives stopped/failed/missing state, never silent success. Verification: `os-runtime liveness fault injection`.

## Engineering execution contract
**Architecture / scope:** Implement executor adapter in the owner-selected location only after U1. Use delivered definitions from G1, gate G2, durable idempotency/lease and bounded retry/cancellation. Scheduling/queues/storage choices depend on hosting; do not preselect infrastructure or credentials. Runtime records source outcomes through K1 and verified export K2.

**Data / APIs:** Run id, definition/policy versions, lease/heartbeat, pause revision, tool grant ids, safe model/provider usage, outcome type, evidence refs and receipt linkage. cost_usd null with cost_reason unless exactly knowable; never combine marginal/amortised/api_list/unknown.

**Security / inputs:** Hosting U1 is undetermined: STOP executor implementation until owner rules in #1257. Restrict context/tool scope by tenant and role, no PHI writes or outbound clinical data, no untrusted tool URLs, prompt injection cannot grant capabilities. Owner determines real model/provider credentials in governed store.

**Dependencies / dedupe:** OS-G1/OS-G2, later OS-K2 export; EYE #1257 split (b)/(c), #1258 pause controls and PR #16 SDK wall. Link their authority; do not create a competing runtime epic. Local capability predecessors: OS-G1, OS-G2.

**Tests / falsifiers:** Real owner-selected runtime in isolated synthetic environment; lease expiry, tool injection, missing grants, pause race, retry, source failure and heartbeat death. RED on killed worker before green restart. Live proof remains open if hosting/credentials unavailable. Each acceptance scenario maps above to its required automated check. See the parent review for UX/accessibility, architecture diagrams, data ER, risk and negative-test matrix. Checks must be seen RED before GREEN; references to future check ids are obligations, not claims they ran.

**Observability:** Heartbeat and explicit stop/failure on every exit; EYE coverage alarm for missed schedule. Usage reports cost basis/reason independently from KPI impact. No always-on claim based on process existence.

**Rollout / rollback:** Owner hosting decision first; one synthetic agent before customer activation. Explicit owner deployment approval required. Kill switch/pause + preserve receipts is rollback; no destructive history rewrite.

**Regression guards:** Existing auth/API/MCP behavior (#5), telemetry acceptance-vs-delivery (#8/#11), item schema and frontend shell are guarded by npm test, build, functions typecheck and real Pages middleware checks. Outbound provider proof (#7/#12) is not claimed from absent credentials. Any confirmed regression links its cause PR/lane and named test.

**Definition of done:** implemented/reviewed/documented; relevant checks seen RED then GREEN; SVG updated and inspected if boundaries change; recorded source-row proof; no unlinked regressions; **does not break linked/dependent work**. ONE PR per delivery slice. Production acceptance requires owner-approved deployment and real read-back, or state exactly: **I could not prove this against the real system.** A local fixture is not customer proof. No deployment before owner approval.

**Estimate — recorded before this child is built:**
- **AI tokens:** 65,000.
- **AI clock time:** 80 minutes (active lane, excludes human waiting).
- **Human time with AI:** 30 minutes (policy/technical review and approval).
- **Cost:** `cost_usd: null`; `cost_basis: unknown`; `cost_reason: exact usage and subscription allocation unavailable`. Never sum cost bases.
- **Confidence / assumptions:** medium-low; synthetic local inputs and existing template tooling; external owner decisions, production credentials, deployment and source proof excluded from allowance. Record measured actuals and variance on completion; do not infer tokens or cost from changed lines.
