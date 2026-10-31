// The blueprint: Northlight's operation today and the discovery plan, transcribed from the two iii.partners documents
// (the operations document and the discovery guide, October 2026). The step graph itself (59 steps, the
// PipeCRM stages and FormKit forms that use them) is copied as-is into flow.json. Wording stays the documents' own;
// the one addition is OS_FOR_SECTION, which says what NL-OS does in place of each lane, and is marked as a proposal.
// Confidential: Northlight internal.
import flow from './flow.json'

export type StepType = 'Trigger' | 'Staff' | 'Manual' | 'Auto' | 'Pipeline' | 'Decision'
export interface Step {
  title: string
  type: StepType
  kind: '' | 'term' | 'dec' | 'end'
  sf: string | null
  who: string[]
  sys: string[]
  changes: string[]
  forms: string[]
  detail: string
  note: string | null
  next: string[]
  prev: string[]
  rel: string[]
  ins: string[]
  wish: string[]
  sop: string
  section: string
}

export const STEPS = flow.nodes as Record<string, Step>
export const STAGE_STEPS = flow.stages as Record<string, string[]>
export const FORM_STEPS = flow.forms as Record<string, string[]>
export const STEP_IDS = Object.keys(STEPS)

/** The flowchart's lanes, in order, with the steps in each. */
export const SECTIONS = [...new Set(STEP_IDS.map((id) => STEPS[id].section))]
  .sort((a, b) => parseInt(a) - parseInt(b))
  .map((name) => ({ name, steps: STEP_IDS.filter((id) => STEPS[id].section === name) }))

/** What NL-OS does in place of each lane. A proposal for discussion in discovery, not a finding. */
export const OS_FOR_SECTION: Record<string, string> = {
  '1 · Lead generation': 'Referral partners and prospects start an inquiry themselves, or staff add one in a single form. The referrer and the greeting are separate fields.',
  '2 · Sales pipeline': 'Qualifying an inquiry sets its program and price from written rules, sends the application and places a hold that expires on its own.',
  '3 · Application received': 'The submitted application lands once, in the guest record, and opens a review with a clock on it.',
  '4 · Medical review': 'The Medical Team records the decision in the clinical space. Approval sends the agreement and the one invoice together and asks for an integrator.',
  '5 · Schedule & purchase': 'Signing and paying confirms the booking: the hold becomes a room, and status is a field, not a tag.',
  '6 · Sessions sequence': 'A readiness checklist with due dates replaces the separate emails, and chases what is missing.',
  '6 · Returning client': 'A returning guest is booked from their record; the package balance and agreement carry over.',
  '7 · Day of session': 'Facilitators write notes inside a three-day access window; one Mark complete fires everything after the session.',
  '8 · LWS & client care': 'Integration Guides see their check-ins and calls due; the Living Well Series runs from the guest record.',
  '9 · Package & retention': 'Package balance decides the next step on its own; a retention call is due seven days after the last session.',
}

export const STEP_TYPES: { id: StepType; word: string; note: string }[] = [
  { id: 'Manual', word: 'Manual', note: 'Admin or team' },
  { id: 'Auto', word: 'Auto', note: 'PipeCRM or integration' },
  { id: 'Pipeline', word: 'Pipeline', note: 'Stage change' },
  { id: 'Staff', word: 'Staff', note: 'Untagged in SOP' },
  { id: 'Decision', word: 'Decision', note: 'A branch in the flowchart' },
  { id: 'Trigger', word: 'Trigger', note: 'Start or hand-off' },
]

export const OVERVIEW = {
  title: 'Northlight Operations',
  summary:
    'How Northlight moves a client from referral to retention today, the systems behind each step, and the NL-OS platform specified to replace them. Compiled from five Northlight documents for discovery.',
  stats: [
    { n: 14, label: 'Tools in stack', note: 'In use today' },
    { n: 4, label: 'PipeCRM pipelines', note: '24 stages' },
    { n: 36, label: 'automation flows', note: '128 flow emails' },
    { n: 18, label: 'Retreat rooms', note: '10 USA · 8 Europe' },
    { n: 12, label: 'Vendors NL-OS replaces', note: 'FRS v5.0' },
  ],
  workload: { total: 75, manual: 43, auto: 26, pipeline: 6, note: 'Chapters 6 and 7 are mostly staff steps the SOP leaves untagged.' },
}

export const CHAPTERS = [
  { id: 'ch1', code: '01', name: 'Lead & sales', pipeline: 'Sales Pipeline', steps: 14, outcome: 'A referral or scholarship lead is captured, valued, held on the CareDesk calendar and sent the Program Application.' },
  { id: 'ch2', code: '02', name: 'Application & medical', pipeline: 'Sales → Onboarding', steps: 19, outcome: 'The application is received, the Medical Team decides, and approved clients are created in CareDesk and moved to payment.' },
  { id: 'ch3', code: '03', name: 'Schedule & invoice', pipeline: 'Onboarding Pipeline', steps: 20, outcome: 'The visit is confirmed, an integrator is assigned, and the retreat or session is invoiced and paid. The most manual chapter: 16 of 20 tagged steps.' },
  { id: 'ch4', code: '04', name: 'Returning clients', pipeline: 'Alternate entry', steps: 8, outcome: 'Clients who already bought a package bypass the lead pipeline and land in Onboarding – Returning.' },
  { id: 'ch5', code: '05', name: 'Session & follow-up', pipeline: 'Onboarding → Post Session', steps: 11, outcome: 'The client is prepared, the session is documented, and post-session automations start.' },
  { id: 'ch6', code: '06', name: 'Care & packages', pipeline: 'Package Use Pipeline', steps: 1, outcome: 'The Integration Guide completes integration care, and package clients are routed back for their next session.' },
  { id: 'ch7', code: '07', name: 'Retention', pipeline: 'Retention Pipeline', steps: 2, outcome: 'After a one-off or final package session, sales decides whether the client continues.' },
] as const

export const COMMS: { when: string; type: 'Manual' | 'Auto' | 'Staff'; text: string; sf?: string }[] = [
  { when: '−60 days', type: 'Manual', text: 'Preparing for your Experience email with Prep Guide' },
  { when: '−60 days', type: 'Auto', text: 'Prep Guide text message', sf: 'SF-21a–d' },
  { when: '−42 days', type: 'Auto', text: 'Medical Substance email', sf: 'SF-09' },
  { when: 'Before', type: 'Staff', text: 'Facilitator and integrator send scheduling links: Intro Calls (new) or Pre-Check Calls (returning)' },
  { when: '−7 days', type: 'Auto', text: 'IV Consent Form email', sf: 'SF-10' },
  { when: '−1 day', type: 'Manual', text: 'Connection Text introducing hospitality staff and arranging travel pick-up' },
  { when: 'Session', type: 'Auto', text: 'Elan’s Integration Audio email once the deal moves to Post Session', sf: 'SF-11' },
  { when: '+48 hours', type: 'Auto', text: 'Follow-Up & Feedback email', sf: 'SF-15' },
  { when: '+48 hours', type: 'Staff', text: 'Integration Guide Post-Visit Check-In' },
  { when: 'Day 3, 4 pm', type: 'Auto', text: 'Retreat Follow-Up and Resources email and SMS', sf: 'SF-13/14' },
  { when: '+96 hours', type: 'Auto', text: 'Post Visit Review email', sf: 'SF-16' },
  { when: '+7 days', type: 'Staff', text: 'Retention call after a one-off or final package session' },
  { when: '1st Monday', type: 'Auto', text: 'Living Well Series, first retreat only: 1 email a week for 8 weeks, with Started, Unsubscribed and Completed tags', sf: 'SF-17' },
]

export type InsightKind = 'Front door' | 'Duplicate entry' | 'Conflict' | 'Bottleneck' | 'Gap' | 'Data model' | 'Pricing' | 'Readiness' | 'Compliance'
export interface Insight {
  id: string
  kind: InsightKind
  title: string
  body: string[]
  refs: string[]
  /** where NL-OS answers it, in this prototype */
  answer: string
}

export const INSIGHTS: Insight[] = [
  {
    id: 'I01', kind: 'Front door', title: 'Intake runs through admin',
    body: ['Leads reach Elan or a salesperson, get relayed to admin, and admin fills in the Referral Form for them. There’s no direct inquiry path for a prospect or referral partner. The referrer’s name also drives the automated texts, which is why “(mine)” goes in when there’s no referrer. Referral source and message personalization are sharing one field.'],
    refs: ['01 Lead ingestion', 'FC 1'],
    answer: 'Guests: New inquiry takes a channel, a referrer and a greeting as separate fields.',
  },
  {
    id: 'I02', kind: 'Duplicate entry', title: 'The same data is keyed in more than once',
    body: [
      'Application data goes into PipeCRM, then admin re-enters it by hand into the CareDesk client record and uploads the PDF, even though a custom API already creates the CareDesk client on approval.',
      'Integrator Assigned is entered in both CareDesk and PipeCRM.',
      'Invoice number and amount are copied from LedgerBooks into PipeCRM.',
      'Payment is recorded in CareDesk, then Paid is set by hand in PipeCRM.',
    ],
    refs: ['02 Application', '03 Invoicing'],
    answer: 'One guest record: the application, integrator, invoice and payment each live in one field.',
  },
  {
    id: 'I03', kind: 'Conflict', title: 'Invoice timing is inconsistent',
    body: ['The SOP has admin send a LedgerBooks invoice when the application arrives, before medical review. The flowchart places it after approval. Chapter 3 then sends an invoice again at purchase. It’s unclear whether that’s one invoice or two, and whether unapproved applicants get invoiced.'],
    refs: ['02 Application', '03 Invoicing', 'FC 4'],
    answer: 'One invoice, sent with the agreement on approval. A prototype choice for Discovery 3 to confirm.',
  },
  {
    id: 'I04', kind: 'Bottleneck', title: 'The medical gate isn’t recorded in a system',
    body: ['The Medical Team’s decision reaches admin, who adds the Approved or Not Approved tag by hand, and that tag starts everything downstream. The SOP has no timer or chaser while a deal sits in Medical Review. The wish list asks for exactly that, which suggests it’s a known bottleneck.'],
    refs: ['02 Medical review', 'Wish list'],
    answer: 'Reviews: the Medical Team decides in the app, and each review shows its days waiting against a target.',
  },
  {
    id: 'I05', kind: 'Gap', title: 'Calendar holds are created early and never released',
    body: ['Sales sets a hold date in CareDesk at the New Lead stage, before any application or medical review. No step clears that hold when a lead is not approved or goes quiet, so room inventory may be overstated.'],
    refs: ['01 Deal valuation', '03 Schedule'],
    answer: 'Every hold carries an expiry date; NL-OS releases it on expiry, on Not approved and on Lost.',
  },
  {
    id: 'I06', kind: 'Gap', title: 'There’s no defined path for lost or stalled leads',
    body: [
      'The Sales pipeline has only three stages, with no Lost, Waitlisted or Unresponsive stage.',
      'Application and invoice reminders stop after 3–4 weeks with nothing defined afterward.',
      'Not Approved clients land in the Retention pipeline, mixed with lapsed clients.',
      'Onboarding repeats the Program Application Sent and Medical Review stages, so where a deal sits doesn’t reliably tell you its status.',
    ],
    refs: ['Pipelines', '01 Reminders'],
    answer: 'Lost and Not approved are their own exits. A stalled application lands in Needs you with a decision to make.',
  },
  {
    id: 'I07', kind: 'Data model', title: 'Status is tracked with tags, by hand',
    body: ['Much of intake is swapping tags: Sent to Received, Scheduled to Invoiced to Paid. Admin tags the contact and automation copies the tag to the deal, and for some tags it doesn’t. Errors are easy, and reporting on conversion stage by stage would be unreliable. The new platform should track status as explicit fields, not tags.'],
    refs: ['02 Application', '03 Invoicing'],
    answer: 'Stage is one explicit field with a date; every stage change is an event in the activity log.',
  },
  {
    id: 'I08', kind: 'Pricing', title: 'Pricing is decided outside the system',
    body: ['The sales team sets the client cost and tells admin. Admin then picks an agreement price from the product library and selects the consulting agreement value by hand, with the same step repeated for returning clients. No pricing rules or exception approvals are written down.'],
    refs: ['01 Deal valuation', '04 Returning'],
    answer: 'Qualifying picks a program, which sets the price; an exception needs a named approver. The rules themselves wait on Discovery 3.',
  },
  {
    id: 'I09', kind: 'Readiness', title: 'Readiness is spread across 60 days with no checklist',
    body: ['Prep Guide acknowledgement, the Medical Substance email at 42 days, IV consent at 7 days, and travel details are each sent separately. Nothing defines what happens if a form isn’t back, or what has to be complete before a client can attend.'],
    refs: ['Comms timeline', 'FormKit forms'],
    answer: 'Each booking gets a readiness checklist with due dates; overdue forms are chased and show on the retreat board.',
  },
  {
    id: 'I10', kind: 'Compliance', title: 'Health status sits in the CRM',
    body: ['Medical Approved and Not Approved are PipeCRM tags, and the application PDF lives in CareDesk. With the FRS calling for HIPAA compliance, Session 2 should decide where medical information is allowed to live.'],
    refs: ['02 Medical review', 'NL-OS compliance'],
    answer: 'Medical detail lives in the clinical space; operations sees the decision and its date, not the detail.',
  },
]

export const INTAKE_FIGURES = [
  { figure: '61 / 75', label: 'Tagged SOP steps in intake' },
  { figure: '36', label: 'Of those are manual' },
  { figure: '5', label: 'Systems before a client is booked' },
  { figure: '3', label: 'Sales pipeline stages, none for lost leads' },
]

export const QUESTIONS_TO_BRING: { q: string; sessions: number[] }[] = [
  { q: 'Is it one invoice or two, and when does it go out?', sessions: [3] },
  { q: 'Who records the medical decision, and how long does review usually take?', sessions: [2, 3] },
  { q: 'What happens to CareDesk holds for leads who drop out?', sessions: [4] },
  { q: 'What happens after the application and invoice reminders stop?', sessions: [3] },
  { q: 'Which forms must be complete before a client can attend?', sessions: [3] },
  { q: 'Should referral partners or prospects be able to start an inquiry themselves?', sessions: [3] },
  { q: 'Where is medical information allowed to live, and who can see it?', sessions: [2] },
]

export const OBSERVATIONS: { kind: string; title: string; body: string; session?: number }[] = [
  { kind: 'Conflict', title: 'Reminder cadence differs between documents', body: 'The SOP says every 7 days for 3 weeks. The newer flowchart says 4 weeks, with admin alerted at weeks 2 and 4. Applies to SF-03 and SF-08.', session: 3 },
  { kind: 'Gap', title: 'Stack list and FRS don’t match', body: 'Zoom, BookTime, MailCast, AppMaker, ChartView and StayOps aren’t on the stack list. InsightBoard, LinkFlow, PayrollOne, PeopleWorks, Vimeo and Canva aren’t covered by the FRS.', session: 2 },
  { kind: 'Gap', title: 'No plan for LedgerBooks', body: 'Every invoice in the SOP goes through LedgerBooks, but the FRS specifies its own POS and ledger with no LedgerBooks bridge or replacement.', session: 3 },
  { kind: 'Scope', title: 'FRS scope vs a Phase 1 retreat board', body: 'The FRS replaces twelve vendors with native PBX, mail server, video and app builder. Discovery keeps system retirement provisional and puts the retreat board first.', session: 6 },
  { kind: 'Check', title: 'Template content in the FRS', body: 'Several sections are marked EXAMPLE, and samples such as laser treatments, a “Dr. Sarah Jenkins” calendar and a “Downtown Suite” location don’t describe Northlight.' },
  { kind: 'Opportunity', title: 'Scheduling and invoicing is the manual hotspot', body: '16 of 20 tagged steps in chapter 3 are manual, across CareDesk, PipeCRM and LedgerBooks. The wish list already asks to automate consents and invoicing.', session: 4 },
]

export const SOURCES = [
  { name: 'Admin Services Pipeline (SOP)', date: '05 Aug 26' },
  { name: 'Client Flow condensed flowchart', date: '11 Aug 26' },
  { name: 'Technology Layout', date: '' },
  { name: 'Technology Stack list', date: '' },
  { name: 'NL-OS Architecture & FRS', date: 'v5.0' },
]

export const WISHES: { title: string; body: string; replaces?: string; flow: string; where: string }[] = [
  { title: 'Apartment history reporting', body: 'Which apartments a guest has stayed in, without opening facilitator notes.', flow: '', where: 'Guest record: stays' },
  { title: 'Facilitator access windows', body: '3-day record access, auto-revoked once notes are entered; admin alerted if notes are late.', flow: 'Facilitator access & auto-revocation windows', where: 'Care: session notes' },
  { title: 'Automated consents & invoicing', body: 'Send the client agreement and invoice together once medically approved and dated.', replaces: 'Replaces steps in 02 and 03.', flow: 'Automated consents & invoicing dispatch', where: 'Reviews: Approve' },
  { title: 'One-click “Mark Complete”', body: 'Fire integration and playlist emails, tag first-timers for LWS, move pipelines.', replaces: 'Replaces steps in 05.', flow: 'One-click completion & pipeline automation', where: 'Retreats: Mark complete' },
  { title: 'Unified info sheet', body: 'One consolidated sheet per retreat with intake, clinical and medical notes.', flow: 'Unified info sheet generation', where: 'Retreats: manifest' },
  { title: 'Integration progress tracking', body: 'Dashboards and milestones for ongoing client integration.', flow: 'Integration progress tracking', where: 'Care: integration' },
  { title: 'Medical approval chasers', body: 'Real-time tracking with SMS/email reminders for missing medical info or forms.', flow: 'Medical approval tracking & automated chasers', where: 'Reviews: days waiting' },
  { title: 'Clinical calculation engine', body: 'A native module for clinical calculations.', flow: '', where: 'Not in this prototype' },
]

export const STACK = ['CareDesk', 'PipeCRM', 'FormKit', 'ShiftHub', 'LedgerBooks', 'CallPad', 'InsightBoard', 'LinkFlow', 'PayrollOne', 'PeopleWorks', 'Gmail', 'Google Workspace', 'Vimeo', 'Canva']

export const PABAU = {
  summary: 'Team members, roles and client access control; one calendar with every retreat booked to one facilitator account; retreats booked by rooms (10 USA, 8 Europe).',
  holds: ['Client record owner and secondary owner', 'Calendar: retreat booking, booked by rooms', 'Client information: contact info and custom fields', 'Appointments, future and past', 'Financial info: invoices and payment records', 'Package info: purchased and redemption tracking', 'Forms and treatment notes', 'Attached documents', 'Gift vouchers'],
}

export const SALESMATE_EXTRAS = [
  { name: 'automation flows / automations', n: 36 },
  { name: 'Flow emails', n: 128 },
  { name: 'Scholarship marketing campaigns', n: 9 },
  { name: 'Misc reports', n: 12 },
  { name: 'L.W. Series email sequence', n: 8 },
]

export const CVOS = {
  summary: 'Northlight OS is specified as one proprietary, multi-tenant platform that permanently replaces a twelve-vendor stack, keeping bi-directional bridges to Google Workspace and Zoom during migration.',
  vendors: [
    { name: 'CareDesk', module: 'M03·06', role: 'Client records, treatment docs, POS, packages, booking', onStack: true },
    { name: 'PipeCRM', module: 'M02', role: 'CRM, pipelines, automation flows, lead scoring', onStack: true },
    { name: 'FormKit', module: 'M04', role: 'Form builder, logic, tables, e-signatures', onStack: true },
    { name: 'CallPad', module: 'M05', role: 'Cloud PBX, SMS, IVR, call transcription', onStack: true },
    { name: 'ShiftHub', module: 'M07', role: 'Shifts, checklists, SOP training, team feed', onStack: true },
    { name: 'Google Workspace', module: 'M05·10', role: 'Mail, docs, sheets, drive · bridged', onStack: true },
    { name: 'Zoom', module: 'M05', role: 'Video, waiting rooms, recording · bridged', onStack: false },
    { name: 'BookTime', module: 'M06', role: 'Public booking, round-robin routing', onStack: false },
    { name: 'MailCast', module: 'M08', role: 'Campaigns, segments, drip journeys', onStack: false },
    { name: 'AppMaker', module: 'M01', role: 'No-code iOS/Android apps and PWAs', onStack: false },
    { name: 'ChartView', module: 'M09', role: 'BI dashboards and KPI reporting', onStack: false },
    { name: 'StayOps', module: 'M06', role: 'Hospitality, housekeeping turnover', onStack: false },
  ],
  goals: [
    ['Consolidation', 'Native telephony, video, email, storage, scheduling, mobile publishing, property ops and BI.'],
    ['Retreat orchestration', 'Retreat A (Sun – Wed AM) and B (Wed PM – Sat) room grids, turnover, intake, referrals, package redemption.'],
    ['AI everywhere', 'Diarized transcription and “Vibe Code” semantic search rendering BI from natural language.'],
    ['Native staff apps', 'iOS and Android at ShiftHub parity.'],
  ],
  security: ['Full HIPAA (incl. BAA) and GDPR compliance', 'SOC 2 Type II controls, session timeouts', 'TLS 1.3 in transit; AES-256 tenant-keyed at rest', 'Postgres row-level tenant isolation', 'Immutable, append-only audit trail of every action'],
  outOfScope: ['Insurance claims, eligibility and copay billing', 'Lab integrations and result ingestion', 'E-prescribing, pharmacy and medication inventory'],
  access: ['Roles from Master Admin to Client Portal', 'Flags: financials, sensitive care notes, Vibe search, app publishing, broadcasts', 'Field-level security on notes and financials'],
}

/* ---------- The Discovery Guide ---------- */

export const OBJECTIVES = [
  ['Understand the current state', 'Map existing sales, intake, data, and retreat workflows.'],
  ['Identify inefficiencies', 'Uncover duplicate entry, manual coordination, bottlenecks, and fragmented systems.'],
  ['Design the future state', 'Determine how workflows should operate with fewer handoffs and greater automation.'],
  ['Define the transformation', 'Identify platform capabilities, integrations, process changes, and priorities.'],
  ['Measure success', 'Establish acceptance criteria, operational improvements, and implementation readiness.'],
] as const

export const APPROACH =
  'Understand how Northlight operates today, identify friction and unnecessary work, define the improved operating model, and scope the AI-native platform that enables it. Questions build on Discovery 1 and validate assumptions rather than presuppose a technical solution.'

export type SessionState = 'held' | 'next' | 'ahead' | 'tbd'
export interface Session {
  n: number
  code: string
  short: string
  name: string
  state: SessionState
  goal?: string
  questions: { q: string; probes: string[] }[]
  deliverables: string[]
}

export const SESSIONS: Session[] = [
  { n: 1, code: 'D1', short: 'Discovery 1', name: 'Discovery 1', state: 'held', questions: [], deliverables: [] },
  {
    n: 2, code: 'DAT', short: 'Data', name: 'Data and compliance', state: 'next',
    goal: 'Define the platform data model, system boundaries, access rules, integrations and compliance requirements.',
    questions: [
      { q: 'What information needs to follow a guest from their initial inquiry through their retreat and post-retreat care?', probes: ['Which information is entered only once?', 'Which fields change along the journey?', 'Where should the authoritative record live?'] },
      { q: 'Can we walk through the existing retreat spreadsheet and identify where every piece of information originates?', probes: ['Which fields come from CareDesk, FormKit, PipeCRM, or manual entry?', 'Which are calculated?', 'Which must remain editable?'] },
      { q: 'Who needs access to which guest information, and at what stage?', probes: ['What should facilitators, integrators, operations, and leadership see?', 'What triggers access grants and revocations?', 'What requires an audit trail?'] },
      { q: 'Which existing systems must exchange data with the new platform during Phase 1?', probes: ['What information moves between them?', 'Is each integration one-way or two-way?', 'What happens when an integration fails?'] },
      { q: 'What compliance requirements must be satisfied before real guest information can enter the new platform?', probes: ['Who owns the required agreements?', 'What must remain in CareDesk?', 'What retention, consent, access and audit requirements apply?'] },
    ],
    deliverables: ['Data model', 'System-of-record boundaries', 'Access matrix', 'Integration inventory', 'Compliance requirements'],
  },
  {
    n: 3, code: 'SAL', short: 'Sales', name: 'Sales and intake', state: 'ahead',
    goal: 'Define the referral-to-booking workflow, CRM requirements, pricing rules, guest intake, and phase boundaries.',
    questions: [
      { q: 'Can someone walk us through an actual referral, from arrival to confirmed retreat booking?', probes: ['Where do referrals originate?', 'Who receives and qualifies them?', 'What fields are captured?', 'What are the lead stages, including lost and waitlisted?', 'What happens when a prospect stops responding?'] },
      { q: 'How should Northlight manage referral relationships and communication in the new platform?', probes: ['Must inquiries be linked to referral partners?', 'What conversation history is needed?', 'Who owns follow-ups and reminders?', 'What can be automated, and what must remain personal?', 'What can partners see?'] },
      { q: 'How does pricing work today, and what flexibility must the platform support?', probes: ['Does pricing vary by retreat, date, guest needs or add-ons?', 'Who approves exceptions?', 'How are deposits, installments, refunds and cancellations handled?', 'Should price tests be tracked?', 'What flows to LedgerBooks?'] },
      { q: 'What happens between agreeing to book and being fully ready to attend?', probes: ['What forms, consents and screening steps are required?', 'What gates confirmation?', 'What must sync to CareDesk and the retreat board?', 'Who handles incomplete tasks and reminders?'] },
      { q: 'What must Silas and the sales team see to manage the pipeline effectively?', probes: ['Which statuses and dashboards matter?', 'What conversion reporting is needed by source, retreat and price point?', 'What belongs in Phase 1 versus Phase 2?', 'What would make PipeCRM unnecessary?'] },
    ],
    deliverables: ['Referral-to-booking map', 'Lead stages and fields', 'Communication needs', 'Pricing rules', 'Intake steps', 'Integration requirements', 'CRM scope'],
  },
  {
    n: 4, code: 'OPS', short: 'Operations', name: 'Operations', state: 'ahead',
    goal: 'Define the retreat board, scheduling rules, exception handling, and conditions for retiring manual tools.',
    questions: [
      { q: 'Can Mara demonstrate how A and B retreats are created and managed today?', probes: ['What is common versus different?', 'What is copied from previous retreats?', 'What can change after creation?'] },
      { q: 'How are facilitators, integrators, and other resources assigned?', probes: ['What rules govern qualifications, availability, guest needs and conflicts?', 'Who approves changes?'] },
      { q: 'What must operations manage before, during, and after each retreat?', probes: ['What checklists, travel, dietary, add-on, schedule and manifest information is required?', 'Who edits it?', 'What must work on mobile, offline or in print?'] },
      { q: 'Which tasks require Mara, Iris, or June to coordinate information manually across systems?', probes: ['Which tasks could be automatic?', 'Which require human approval?', 'What exceptions recur?', 'What should trigger notifications?'] },
      { q: 'What must the new retreat board do before Mara is comfortable retiring the spreadsheet?', probes: ['What are the non-negotiables?', 'What exports and printed outputs remain?', 'How should in-progress retreats migrate?', 'What constitutes a successful pilot?'] },
    ],
    deliverables: ['Retreat templates', 'Workflows', 'Staffing and assignment rules', 'Automation candidates', 'Exception paths', 'Phase 1 acceptance criteria'],
  },
  { n: 5, code: 'TBD', short: 'To be defined', name: 'To be defined', state: 'tbd', goal: 'Session 5 remains to be defined separately.', questions: [], deliverables: [] },
  {
    n: 6, code: 'GO', short: 'Go/no-go', name: 'Findings and go/no-go', state: 'ahead',
    goal: 'Confirm scope, implementation priorities, dependencies, ownership, acceptance criteria and readiness to proceed.',
    questions: [
      { q: 'Have we accurately captured the workflows the platform needs to support?', probes: ['What is missing or incorrect?', 'Which processes should be redesigned rather than copied?'] },
      { q: 'Which capabilities are essential for the first usable release?', probes: ['What can wait?', 'Which integrations are prerequisites?', 'What is the smallest complete workflow that creates operational value?'] },
      { q: 'Which systems will remain, integrate, or eventually be replaced?', probes: ['What migration dependencies exist?', 'Who owns the data?', 'What happens if a vendor API cannot support the desired flow?'] },
      { q: 'How will we validate that the platform is ready for operational use?', probes: ['Who signs off?', 'Can we test a representative retreat?', 'What compliance checks are required?', 'What is the rollback plan?'] },
      { q: 'What decisions, resources, and approvals are needed to start implementation?', probes: ['Who is product owner?', 'Who decides scope?', 'What budget and schedule constraints apply?', 'What could delay the project?'] },
    ],
    deliverables: ['Approved scope', 'Prioritized release plan', 'Acceptance criteria', 'Responsibilities', 'Dependencies', 'Budget and timeline assumptions', 'Go/no-go decision'],
  },
]

export const SCOPE_DECISIONS: { kind: string; title: string; body: string; session: number }[] = [
  { kind: 'Phase boundary', title: 'Can PipeCRM feed the Phase 1 retreat board?', body: 'Discovery 1 puts retreat operations in Phase 1 and sales/pipeline in Phase 2. Confirm a PipeCRM integration can supply the booking data, or whether a limited booking workflow must be built sooner.', session: 3 },
  { kind: 'Hypothesis', title: 'Measure Mara’s current workload', body: 'Treat the proposed 80% reduction in retreat administration as a hypothesis until her workload is measured.', session: 4 },
  { kind: 'Provisional', title: 'Hold architecture and system retirement', body: 'Keep these proposals provisional until workflow, data access, compliance, and vendor API constraints are confirmed.', session: 6 },
  { kind: 'Open', title: 'Define Session 5', body: 'Session 5 remains to be defined separately.', session: 5 },
]
