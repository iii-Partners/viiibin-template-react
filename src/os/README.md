# Northlight OS

A living prototype of the operating system Northlight's discovery is scoping: one record per guest, from the first
inquiry to retention, worked from three sides. It is built from two iii.partners documents (October 2026,
confidential): *Northlight Operations* (how a client moves from referral to retention today, compiled from five
Northlight documents) and the *Northlight Discovery Guide* (six sessions, their questions and deliverables).

## Who it serves

| Lens | Views | What they do there |
|---|---|---|
| Operations (Mara, Iris, June; Silas for sales) | Today, Guests, Retreats | Qualify inquiries, watch holds and payments, chase readiness forms, assign integrators, mark sessions complete, run the retreat board |
| Clinical (the Medical Team, facilitators, Integration Guides) | Medical reviews, Sessions and care | Decide reviews against a 2-day target, write session notes inside a 3-day access window, run the 48-hour check-in, calls and finalization |
| The guest | Guest portal | Submit the application, sign, pay, return readiness forms, see their retreat and timeline; a prospect can start an inquiry |
| Everyone | Blueprint | Today's 59-step flow, the 10 intake insights, the systems, the NL-OS target and the discovery plan, each tied to what the OS does instead |

## What makes it living

Every action changes one shared state (`store.ts`), and NL-OS answers with automations that land in the activity log,
each naming the step of today's flowchart it replaces. **Next day** (on Today and in Settings) advances the clock and
runs the time-based automations: application and invoice reminders, hold expiry, form chasers, retreat check-in and the
Living Well Series. **Needs you** (`needs.ts`) is computed from the state, so it changes as people act. Settings
resets the example data.

## What is real and what is invented

- **From the documents:** the 59 steps and their links (copied as-is into `flow.json`), the chapters, insights,
  communications timeline, systems, NL-OS specification, wish list, discovery sessions, scope decisions and
  observations (`blueprint.ts`), and the names Mara, Iris, June, Silas, Elan and Rosa.
- **Invented for the prototype:** every guest, price, invoice number, facilitator, Integration Guide and the Medical
  Team member's name (`seed.ts`).
- **Placeholders for discovery to replace:** the 2-day review target, the 21-day hold, the 14-day travel-form due date,
  one invoice sent with the agreement on approval (insight I03), and the "In NL-OS" proposal for each lane. Each is
  named where it is defined.
