## Customer product contract
**Parent:** #14 · **Capability:** OS-C1 · **Status:** READY for schema after dependencies; BLOCKED for real feature catalog/manifest ratification

**Problem:** Customizing each client by editing base modules causes forks and inconsistent KPI/governance behavior.

**Desired outcome / user story:** As a business operator, different businesses receive different approved features, KPI declarations and delivered roles through a stable pack while retaining one governed base.

**User journey:** iii assembles an approved client pack; validation resolves its KPI/role/feature references; deployment conformance checks it; EYE shows only the delivered components and their health.

**Business rules:** No real client defaults. No unresolved references or arbitrary executable code in a manifest. Customer admin/analytics remain only in EYE; shipped stakeholder settings are end-user product settings. A manifest cannot weaken authority, SDK wall or source verification.

**Visual example / states:** [Control surface SVG](https://github.com/iii-Partners/viiibin-template-react/blob/lane/iii-Partners-viiibin-template-react-14/docs/business-os/control-surface.svg). EYE alone hosts operator UI; stakeholder apps stay in the OS. Loading is pending, absence is unmeasured, failure is unavailable, success includes a source witness. No fixture represents a customer or revenue.

**Observable acceptance criteria → verification:**
1. **Given** two synthetic packs with different measures/features, **When** the base loads each manifest, **Then** each sees only its own declared components without base-code edits. Verification: `os-client-pack two-pack integration`.
2. **Given** an unknown feature, role or KPI reference, **When** manifest validation runs, **Then** delivery is refused by name. Verification: `os-client-pack reference negative tests`.
3. **Given** an admin/analytics/authoring route or authority-widening override, **When** conformance runs, **Then** the check goes RED before release. Verification: `os-client-pack surface/authority mutation`.

## Engineering execution contract
**Architecture / scope:** Versioned JSON delivery manifest and pure loader: feature ids, surface classes, KPI definition refs and delivered-agent pack refs. Avoid dynamic code evaluation/plugins. Align with EYE business-os/v1 (#1254) and project catalog (#1248); export customer-safe components, keep iii authoring/build metadata out.

**Data / APIs:** Pack id/version, deployment venture binding, referenced definition versions, component ids/type/health refs and ratification reference. Append ratification history. Unknown catalog entries are rejected; no invented feature enum before U4.

**Security / inputs:** Owner U4 on EYE #1248 supplies feature catalog; named human ratifies each real manifest. Never store credentials, prompt/tool/model authoring contents or PHI in the pack. No customer GitHub identifiers or cross-project default fallback.

**Dependencies / dedupe:** OS-K1 and OS-G1; EYE #1248/#1254 owns project catalog/manifest display; template PR #16 owns authoring/SDK wall. This child adds only template pack composition and admin-route conformance, not duplicate EYE UI. Local capability predecessors: OS-K1, OS-G1.

**Tests / falsifiers:** Two synthetic packs validate and load with distinct definitions. Plant missing ref, dependency cycle, off-scope role, admin route and secret-like field. Build/regression suite remains green apart from explicitly inherited findings. Native binaries require separate device proof if changed. Each acceptance scenario maps above to its required automated check. See the parent review for UX/accessibility, architecture diagrams, data ER, risk and negative-test matrix. Checks must be seen RED before GREEN; references to future check ids are obligations, not claims they ran.

**Observability:** Read pack version and missing/conformance status from health without secrets. No silently ignored fields or feature failures.

**Rollout / rollback:** Schema and synthetic packs first. Real catalog/ratification and explicit deployment approval required. Revert active pack pointer through a new governed version; retain history.

**Regression guards:** Existing auth/API/MCP behavior (#5), telemetry acceptance-vs-delivery (#8/#11), item schema and frontend shell are guarded by npm test, build, functions typecheck and real Pages middleware checks. Outbound provider proof (#7/#12) is not claimed from absent credentials. Any confirmed regression links its cause PR/lane and named test.

**Definition of done:** implemented/reviewed/documented; relevant checks seen RED then GREEN; SVG updated and inspected if boundaries change; recorded source-row proof; no unlinked regressions; **does not break linked/dependent work**. ONE PR per delivery slice. Production acceptance requires owner-approved deployment and real read-back, or state exactly: **I could not prove this against the real system.** A local fixture is not customer proof. No deployment before owner approval.

**Estimate — recorded before this child is built:**
- **AI tokens:** 30,000.
- **AI clock time:** 40 minutes (active lane, excludes human waiting).
- **Human time with AI:** 10 minutes (policy/technical review and approval).
- **Cost:** `cost_usd: null`; `cost_basis: unknown`; `cost_reason: exact usage and subscription allocation unavailable`. Never sum cost bases.
- **Confidence / assumptions:** medium-low; synthetic local inputs and existing template tooling; external owner decisions, production credentials, deployment and source proof excluded from allowance. Record measured actuals and variance on completion; do not infer tokens or cost from changed lines.
