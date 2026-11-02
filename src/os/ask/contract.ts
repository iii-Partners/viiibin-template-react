// The contract between the Ask view and Claude: the tools Claude may call and the instructions it answers under.
// The browser holds Northlight OS's data, so the browser runs every tool (tools.ts) and the server only relays each
// turn to Claude (functions/api/ask.ts). Both import this file, so the two sides always describe the same tools.
// No React or browser code here: the Pages Function bundles it too.
import type Anthropic from '@anthropic-ai/sdk'

export const ASK_MODEL = 'claude-opus-5-5'

const STAGE_IDS = ['inquiry', 'application', 'review', 'agreement', 'preparing', 'retreat', 'integration', 'retention', 'inactive', 'not-approved', 'lost']
const LENSES = ['operations', 'sales', 'clinical', 'care']
const str = (description: string) => ({ type: 'string', description })
const num = (description: string) => ({ type: 'number', description })
const bool = (description: string) => ({ type: 'boolean', description })
const obj = (properties: Record<string, unknown>, required: string[] = []): Anthropic.Tool.InputSchema => ({ type: 'object', properties, required })

export const ASK_TOOLS: Anthropic.Tool[] = [
  {
    name: 'overview',
    description: 'The state of the whole business today: guests on the journey, how many things need a person, booked value, outstanding invoices, retreats in the next 30 days, and guests by stage. Use for broad questions ("how are we doing", "give me a summary").',
    input_schema: obj({}),
  },
  {
    name: 'pipeline',
    description: 'Guests by journey stage with counts, and how many moved from each stage to the next. Use for funnel, conversion and "where are guests" questions.',
    input_schema: obj({ include_exits: bool('Also count guests who left (inactive, not approved, lost).') }),
  },
  {
    name: 'find_guests',
    description: 'List guests that match filters. Every filter is optional and they combine with AND. Use for "who" questions: who is in medical review, who came through a partner, who owes forms, who is returning, who is unpaid.',
    input_schema: obj({
      stages: { type: 'array', items: { type: 'string', enum: STAGE_IDS }, description: 'Journey stages to include.' },
      channel: { type: 'string', enum: ['Elan', 'Salesperson', 'Referral partner', 'Direct inquiry'] },
      referrer: str('Part of the referrer name, e.g. "Harbor".'),
      retreat: str('A retreat id or name, e.g. "A41" or "Highlands 41".'),
      program: { type: 'string', enum: ['one-off', 'package-4', 'scholarship'] },
      returning: bool('Only returning guests (true) or only first-time guests (false).'),
      integrator: str('Integration Guide name.'),
      overdue_forms: bool('Only guests with a readiness form past its due date.'),
      unpaid: bool('Only guests with an unpaid invoice.'),
      text: str('Part of a name, email or home city.'),
      limit: num('Most rows to return; default 25.'),
    }),
  },
  {
    name: 'guest_profile',
    description: 'One guest in full: stage and how long they have been there, program and price, retreat and room, medical status (never clinical notes), agreement and invoice, readiness forms, integration care, what needs a person, and recent activity.',
    input_schema: obj({ guest: str('The guest\'s name (full or part) or id.') }, ['guest']),
  },
  {
    name: 'needs',
    description: 'The exceptions that wait on a person right now, most urgent first, each with its owner and reason. Filter by lens (team) or severity.',
    input_schema: obj({
      lens: { type: 'string', enum: LENSES, description: 'operations, sales, clinical (Medical Team) or care (Integration Guides and facilitators).' },
      urgent_only: bool('Only blocked and at-risk items.'),
    }),
  },
  {
    name: 'retreats',
    description: 'Retreats with dates, facilitator, rooms booked, held and free. Filter by time window or site. Use for capacity, occupancy and schedule questions.',
    input_schema: obj({
      window: { type: 'string', enum: ['upcoming', 'past', 'all', 'this_week', 'this_month'], description: 'Default upcoming.' },
      site: { type: 'string', enum: ['Highlands', 'Europe'] },
    }),
  },
  {
    name: 'retreat_detail',
    description: 'One retreat: its roster with rooms, each guest\'s stage and readiness, holds, occupancy, and its facilitator.',
    input_schema: obj({ retreat: str('A retreat id or name, e.g. "A41", "B #41", "Europe 12".') }, ['retreat']),
  },
  {
    name: 'revenue',
    description: 'Money: value booked, invoiced, paid and outstanding, grouped by program, channel, retreat or invoice status, and the unpaid invoices with their age.',
    input_schema: obj({ group_by: { type: 'string', enum: ['program', 'channel', 'retreat', 'status'], description: 'Default program.' } }),
  },
  {
    name: 'channels',
    description: 'Where guests come from: counts by channel (Elan, salesperson, referral partner, direct inquiry), the referrers behind them, and how many of each reached a booking.',
    input_schema: obj({}),
  },
  {
    name: 'medical_reviews',
    description: 'The medical review queue: who waits, for how many days against the 2-day target, decisions made and the approval rate. Never returns clinical notes.',
    input_schema: obj({}),
  },
  {
    name: 'readiness',
    description: 'The readiness checklist (Prep Guide acknowledgement, Medical Substance form, travel details, IV consent) across booked guests: returned, open and overdue for each form, and who is overdue.',
    input_schema: obj({ retreat: str('Limit to one retreat, by id or name.') }),
  },
  {
    name: 'care',
    description: 'Integration and aftercare: 48-hour check-ins due and done, integration calls, finalized care, Living Well Series status, late session notes, retention calls due.',
    input_schema: obj({}),
  },
  {
    name: 'staff_workload',
    description: 'Work by person: guests per Integration Guide, retreats per facilitator, and open needs per team. Use for capacity and "who is busiest" questions.',
    input_schema: obj({}),
  },
  {
    name: 'activity',
    description: 'The activity log: what people and NL-OS automations did, newest first. Filter by guest, actor, days back, or automations only.',
    input_schema: obj({
      guest: str('Guest name or id.'),
      actor: str('A person\'s name, or "NL-OS" for automations.'),
      days: num('How many days back; default 14.'),
      automations_only: bool('Only what NL-OS did on its own.'),
    }),
  },
  {
    name: 'automation_impact',
    description: 'What NL-OS has taken over: automations run, the manual flowchart steps they replace, and the split between automated and manual work in the log.',
    input_schema: obj({}),
  },
  {
    name: 'upcoming',
    description: 'Dated work in the next days on one timeline: retreat starts, form due dates, hold expiries, check-ins and retention calls.',
    input_schema: obj({ days: num('How many days ahead; default 21.') }),
  },
  {
    name: 'blueprint',
    description: 'The discovery documents behind the OS: the 10 intake insights, today\'s 59-step flowchart (manual, staff and automated steps by section), the systems in use, and the six discovery sessions. Use for "why", process and "what does today look like" questions.',
    input_schema: obj({
      topic: { type: 'string', enum: ['insights', 'flow', 'systems', 'sessions'], description: 'Default insights.' },
      query: str('Words to match in titles and bodies.'),
    }),
  },
]

export const ASK_SYSTEM = `You answer questions from Northlight's admin team inside Northlight OS, the system that runs a retreat business from first inquiry to retention. The data is example data for a prototype.

You can call tools that read the live state. Each tool also draws cards for the person: stats, charts, tables, guest lists, timelines. The cards carry the detail, so your written answer should not repeat what they show.

How to answer:
- Call the tools that answer the question, several at once when they are independent. Call only tools whose cards help with this question; each one adds cards to the answer.
- Then write two to four short sentences that state the answer first, with the specific numbers and names that matter, and say what deserves attention. Plain text only: no headings, lists, tables or markdown.
- If the tools cannot answer the question, say what you can answer instead.
- Use US English. Dates like "Nov 3". Money like "$9,500".
- Clinical notes and medical flags stay private to the Medical Team. You never see them, and you say so if asked.`
