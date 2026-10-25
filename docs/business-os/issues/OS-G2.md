## Customer product contract
**Parent:** #14 · **Capability:** OS-G2 · **Status:** BLOCKED — owner supplies authority tiers, signer rule and permitted customer levers

**Problem:** A role description or an approval button cannot prevent an unauthorized side effect.

**Desired outcome / user story:** As a business operator, an operator can rely on an agent acting only within authority, holding for a human when required, and recording who authorized every consequential act.

**User journey:** An act proposal enters one server authorization door; the door acts, holds or refuses; a human decides held work only in EYE; the executor re-reads the decision and emits an immutable act receipt.

**Business rules:** No handler bypasses the door. Enforce role ownership, explicit grants, ceiling and never-auto restrictions before effects. A held proposal has no effect. Approval is scoped/versioned/expiring and cannot be replayed for a different act. No PHI writes.

**Visual example / states:** [Control surface SVG](https://github.com/iii-Partners/viiibin-template-react/blob/lane/iii-Partners-viiibin-template-react-14/docs/business-os/control-surface.svg). EYE alone hosts operator UI; stakeholder apps stay in the OS. Loading is pending, absence is unmeasured, failure is unavailable, success includes a source witness. No fixture represents a customer or revenue.

**Observable acceptance criteria → verification:**
1. **Given** an act inside a ratified ceiling, **When** the gate authorizes execution, **Then** a receipt records actor, authority version, tier and proof. Verification: `os-action-door within-ceiling contract`.
2. **Given** an above-ceiling act with no human decision, **When** execution is requested, **Then** it remains held with zero side effects. Verification: `os-action-door held negative test`.
3. **Given** a wrong/expired/replayed decision or forbidden act, **When** the executor re-reads authorization, **Then** execution is refused and the attempt remains recorded. Verification: `os-action-door signer/replay/never-auto tests`.

## Engineering execution contract
**Architecture / scope:** One pure policy evaluator plus durable proposals/decisions/act receipt store. Port app.iii decision-ledger INSERT-only triggers and constitution/capability gates. Adapter consumes EYE #1253 decisions and emits #1249 governed-action/v1 projection; no new customer approval endpoint/UI here.

**Data / APIs:** Immutable proposal id/hash, role/grant and policy versions, requested lever, tier, decision id/approver/expiry, execution id/outcome and source read-back reference. Corrections append; no mutable receipt status overwrite. Approval consumption and side-effect idempotency must be atomic or use a documented outbox.

**Security / inputs:** STOP until owner determines U6/U7 on EYE #1258 and U2 signer authority on #1253. This ticket does not pick tiers, identity claims or signer trust. Validate exact tenant/action/hash; prohibit bypass, confused-deputy and stale-decision reuse.

**Dependencies / dedupe:** OS-G1; EYE #1253 signer/decision door, #1249 governed-action projection, #1258 authority/write levers; app.iii immutability mechanisms. This is the template-side enforcement subtask, not another operator UI. Local capability predecessors: OS-G1.

**Tests / falsifiers:** Side-effect spy plus real local database tests prove no effect on hold/refuse, exactly one on retry, and immutable decision read-back. Plant gate bypass, tampered action hash, foreign tenant signer and receipt update; all must fail. Live signer proof needs owner-authorized EYE inputs. Each acceptance scenario maps above to its required automated check. See the parent review for UX/accessibility, architecture diagrams, data ER, risk and negative-test matrix. Checks must be seen RED before GREEN; references to future check ids are obligations, not claims they ran.

**Observability:** Every proposal reaches acted/held/refused/failed with an auditable recorded row. Missing receipt is an alarm. No model chain-of-thought, payload secrets or PHI in telemetry.

**Rollout / rollback:** Disabled until owner authority/signer inputs and policy tests are accepted. Deploy only after explicit approval. Rollback pauses executor and retains decisions/receipts; never edits history.

**Regression guards:** Existing auth/API/MCP behavior (#5), telemetry acceptance-vs-delivery (#8/#11), item schema and frontend shell are guarded by npm test, build, functions typecheck and real Pages middleware checks. Outbound provider proof (#7/#12) is not claimed from absent credentials. Any confirmed regression links its cause PR/lane and named test.

**Definition of done:** implemented/reviewed/documented; relevant checks seen RED then GREEN; SVG updated and inspected if boundaries change; recorded source-row proof; no unlinked regressions; **does not break linked/dependent work**. ONE PR per delivery slice. Production acceptance requires owner-approved deployment and real read-back, or state exactly: **I could not prove this against the real system.** A local fixture is not customer proof. No deployment before owner approval.

**Estimate — recorded before this child is built:**
- **AI tokens:** 55,000.
- **AI clock time:** 60 minutes (active lane, excludes human waiting).
- **Human time with AI:** 25 minutes (policy/technical review and approval).
- **Cost:** `cost_usd: null`; `cost_basis: unknown`; `cost_reason: exact usage and subscription allocation unavailable`. Never sum cost bases.
- **Confidence / assumptions:** medium-low; synthetic local inputs and existing template tooling; external owner decisions, production credentials, deployment and source proof excluded from allowance. Record measured actuals and variance on completion; do not infer tokens or cost from changed lines.
