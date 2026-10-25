## Customer product contract
**Parent:** #14 · **Capability:** OS-K2 · **Status:** BLOCKED — owner supplies approved source allowlist and real project binding before activation

**Problem:** A stored observation alone cannot prove the underlying business source or become a signed before/after comparison.

**Desired outcome / user story:** As a business operator, eYE sees verified, reproducible measurements for each project and honest missing-source states without a second analytics surface.

**User journey:** The connector reads a declared source and stored observation, re-derives the number, then sends only a conformant measurement to EYE. EYE joins its own countersigned baseline.

**Business rules:** Never manufacture a baseline/signed_ref or accept a producer self-report as proof. Null/unreadable does not serialize as client-kpi/v1 numeric zero. demo is excluded from customer/revenue figures. Cost bases are never combined; unknown cost is null with cost_reason.

**Visual example / states:** [Control surface SVG](https://github.com/iii-Partners/viiibin-template-react/blob/lane/iii-Partners-viiibin-template-react-14/docs/business-os/control-surface.svg). EYE alone hosts operator UI; stakeholder apps stay in the OS. Loading is pending, absence is unmeasured, failure is unavailable, success includes a source witness. No fixture represents a customer or revenue.

**Observable acceptance criteria → verification:**
1. **Given** an approved source adapter and observation, **When** the connector re-reads its source, **Then** only matching unit/period/value with source witness becomes a measurement. Verification: `os-source-readback contract test`.
2. **Given** an absent baseline or failed source, **When** EYE receives the outcome, **Then** it shows No baseline or unavailable, with no invented delta. Verification: `os-source-missing + existing EYE #1251 browser test`.
3. **Given** a retried export or demo fixture, **When** the connector projects readings, **Then** one measurement per observation, no duplicate or demo customer/revenue entry. Verification: `os-eye-projection contract mutation`.

## Engineering execution contract
**Architecture / scope:** Template-side adapter registry keyed by opaque source_ref; fixed allowlist, no arbitrary URL/SQL execution from a payload. Read local API with the existing server machine identity. Map verified finite readings to canonical EYE contracts/schemas/client-kpi.v1.schema.json; a separate delivery receipt distinguishes accepted from delivered/read-back.

**Data / APIs:** Preserve venture_id/kpi_key, definition version, source witness, observation id, canonical UTC period and stable dedupe key. Record verification failure independently of reading. Signed baseline remains in EYE; no second baseline ledger. Version connector envelope before extending canonical schema.

**Security / inputs:** Owner must determine source allowlist, credential grants and retention in governed config; no guessed hosts/keys. EYE tenancy/project binding must be re-read, not email/domain inferred. No PHI export, raw query result, prompt, repository or secret fields. SSRF/SQL injection negative tests.

**Dependencies / dedupe:** OS-K1; reuse EYE #1005/#1077/#1079 (KPI source/readback), #1248 (project binding), #1251 (display), #807/#808 (proof reads). These are cross-repo dependencies, not duplicated UI tickets. Local capability predecessors: OS-K1.

**Tests / falsifiers:** Source adapters use synthetic reproducible SQLite/HTTP sources locally; falsify source value, unit, period, host and venture binding. Real-system acceptance additionally requires an owner-authorized source and EYE authenticated read-back; absent inputs STOP this ticket. Each acceptance scenario maps above to its required automated check. See the parent review for UX/accessibility, architecture diagrams, data ER, risk and negative-test matrix. Checks must be seen RED before GREEN; references to future check ids are obligations, not claims they ran.

**Observability:** Count declared/verified/unsourced/failed exports without business values or credentials in telemetry. Persist safe source and delivery witnesses. Telemetry acceptance is not delivery.

**Rollout / rollback:** Adapter disabled until allowlist and bindings are determined. Add one source type first; owner authorizes production proof/deploy. Revert connector enablement, never rewrite measurements.

**Regression guards:** Existing auth/API/MCP behavior (#5), telemetry acceptance-vs-delivery (#8/#11), item schema and frontend shell are guarded by npm test, build, functions typecheck and real Pages middleware checks. Outbound provider proof (#7/#12) is not claimed from absent credentials. Any confirmed regression links its cause PR/lane and named test.

**Definition of done:** implemented/reviewed/documented; relevant checks seen RED then GREEN; SVG updated and inspected if boundaries change; recorded source-row proof; no unlinked regressions; **does not break linked/dependent work**. ONE PR per delivery slice. Production acceptance requires owner-approved deployment and real read-back, or state exactly: **I could not prove this against the real system.** A local fixture is not customer proof. No deployment before owner approval.

**Estimate — recorded before this child is built:**
- **AI tokens:** 40,000.
- **AI clock time:** 40 minutes (active lane, excludes human waiting).
- **Human time with AI:** 15 minutes (policy/technical review and approval).
- **Cost:** `cost_usd: null`; `cost_basis: unknown`; `cost_reason: exact usage and subscription allocation unavailable`. Never sum cost bases.
- **Confidence / assumptions:** medium-low; synthetic local inputs and existing template tooling; external owner decisions, production credentials, deployment and source proof excluded from allowance. Record measured actuals and variance on completion; do not infer tokens or cost from changed lines.
