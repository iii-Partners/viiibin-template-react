## Customer product contract
**Parent:** #14 · **Capability:** OS-G1 · **Status:** READY for contract work; owner ratification required for real role/authority values

**Problem:** App user/admin/owner permissions and chat state do not describe governed business agents or their responsibility.

**Desired outcome / user story:** As a business operator, an operator can understand each delivered agent role, responsibility and source-backed KPI through EYE without authoring code or prompts.

**User journey:** iii delivers an owner-ratified role pack; the registry validates hierarchy, ownership and KPI references; EYE consumes a customer-safe read model.

**Business rules:** Separate role from occupant. Exactly one owner per consequential lever. Hierarchy is acyclic and cannot grant authority absent from a role capability. No default autonomous ceiling, raw SDK/prompt/model editor or customer GitHub field. Unresolved authority is refused by name.

**Visual example / states:** [Control surface SVG](https://github.com/iii-Partners/viiibin-template-react/blob/lane/iii-Partners-viiibin-template-react-14/docs/business-os/control-surface.svg). EYE alone hosts operator UI; stakeholder apps stay in the OS. Loading is pending, absence is unmeasured, failure is unavailable, success includes a source witness. No fixture represents a customer or revenue.

**Observable acceptance criteria → verification:**
1. **Given** two delivered roles with different responsibilities, **When** the pack is validated and read, **Then** the hierarchy, lever ownership and KPI read-back references are explicit. Verification: `os-agent-definition contract test`.
2. **Given** a hierarchy cycle, duplicate lever owner or unknown KPI, **When** delivery validates the pack, **Then** the contract refuses each named inconsistency. Verification: `os-agent-definition negative tests`.
3. **Given** an undeclared ceiling or raw authoring field, **When** a delivered definition is accepted, **Then** acceptance fails closed and no customer authoring control appears. Verification: `os-agent-schema-closed + PR #16 boundary`.

## Engineering execution contract
**Architecture / scope:** Pure dependency-light delivered-agent/v1 and role-pack/v1 schemas plus server registry/read model; extend no UI. Port app.iii constitution/capability-matrix mechanisms, not its animation motion_tier. Data only, executor remains OS-G3. Scope every role/occupant/grant by project/venture.

**Data / APIs:** Role id, owner ref, parent role, charter, lever grants, authority policy reference/version, occupant reference, KPI/read-back refs and delivery version. Customer-safe projection excludes iii authoring details. Version changes append with predecessor reference.

**Security / inputs:** No real role, tier or policy guessed. Owner ratifies the concrete pack; a reference alone is not signature proof. Block unresolved policy. Deny off-roster roles and attempts to widen ancestor authority. No PHI in charters/context.

**Dependencies / dedupe:** Reuse EYE #1257 split (a), #1074/#1077, #1249 customer-safe action shape; app.iii constitution.ts/capability-matrix-gate.ts. No duplicate EYE agent cards (#1258). OS-K1 required only for concrete KPI binding integration. Local capability predecessors: none.

**Tests / falsifiers:** Closed-schema tests, cycle/multiple-owner mutation tests, two-project isolation and contract round-trip. Planted ceiling and missing read-back mutations must be seen RED. Schema work does not claim executor behavior. Each acceptance scenario maps above to its required automated check. See the parent review for UX/accessibility, architecture diagrams, data ER, risk and negative-test matrix. Checks must be seen RED before GREEN; references to future check ids are obligations, not claims they ran.

**Observability:** Expose missing/invalid/ready definition status with source version. No always-on/available claim until OS-G3 liveness is measured.

**Rollout / rollback:** Local schema first, no live agent activation. Real role pack and authority contract require human ratification. Preserve prior definition versions when reverting.

**Regression guards:** Existing auth/API/MCP behavior (#5), telemetry acceptance-vs-delivery (#8/#11), item schema and frontend shell are guarded by npm test, build, functions typecheck and real Pages middleware checks. Outbound provider proof (#7/#12) is not claimed from absent credentials. Any confirmed regression links its cause PR/lane and named test.

**Definition of done:** implemented/reviewed/documented; relevant checks seen RED then GREEN; SVG updated and inspected if boundaries change; recorded source-row proof; no unlinked regressions; **does not break linked/dependent work**. ONE PR per delivery slice. Production acceptance requires owner-approved deployment and real read-back, or state exactly: **I could not prove this against the real system.** A local fixture is not customer proof. No deployment before owner approval.

**Estimate — recorded before this child is built:**
- **AI tokens:** 35,000.
- **AI clock time:** 40 minutes (active lane, excludes human waiting).
- **Human time with AI:** 15 minutes (policy/technical review and approval).
- **Cost:** `cost_usd: null`; `cost_basis: unknown`; `cost_reason: exact usage and subscription allocation unavailable`. Never sum cost bases.
- **Confidence / assumptions:** medium-low; synthetic local inputs and existing template tooling; external owner decisions, production credentials, deployment and source proof excluded from allowance. Record measured actuals and variance on completion; do not infer tokens or cost from changed lines.
