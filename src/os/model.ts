// The living model behind Northlight OS: guests, retreats, staff and the events that move them. Status is an explicit
// field with a date (insight I07), never a tag. Everything here is example data for a prototype; the documents
// describe the process, not real guests, so every guest, price and staff name below Mara's team is invented.
import type { Status } from '@/components/system/status'

/** One day, as YYYY-MM-DD. The prototype keeps its own clock so a day can be advanced. */
export type Day = string

export const day = (d: Date) => d.toISOString().slice(0, 10)
export const addDays = (d: Day, n: number) => {
  const x = new Date(`${d}T12:00:00Z`)
  x.setUTCDate(x.getUTCDate() + n)
  return day(x)
}
export const daysBetween = (a: Day, b: Day) => Math.round((Date.parse(`${b}T12:00:00Z`) - Date.parse(`${a}T12:00:00Z`)) / 86_400_000)
export const fmt = (d: Day, opts: Intl.DateTimeFormatOptions = { month: 'short', day: 'numeric' }) =>
  new Date(`${d}T12:00:00Z`).toLocaleDateString('en-US', { ...opts, timeZone: 'UTC' })
export const weekday = (d: Day) => new Date(`${d}T12:00:00Z`).getUTCDay()

export type StageId = 'inquiry' | 'application' | 'review' | 'agreement' | 'preparing' | 'retreat' | 'integration' | 'retention' | 'inactive' | 'not-approved' | 'lost'

/** The journey as explicit stages: who owns each one, and how it reads as a status. Today the same journey is 24
 *  PipeCRM stages across four pipelines plus tags (Systems today). */
export const STAGES: { id: StageId; word: string; owner: string; st: Status; exit?: boolean; today: string }[] = [
  { id: 'inquiry', word: 'Inquiry', owner: 'Sales', st: 'pending', today: 'Sales: New Lead' },
  { id: 'application', word: 'Application', owner: 'Guest', st: 'ok', today: 'Sales: Program Application Sent' },
  { id: 'review', word: 'Medical review', owner: 'Medical Team', st: 'pending', today: 'Sales: Medical Review Stage' },
  { id: 'agreement', word: 'Agreement & payment', owner: 'Guest', st: 'ok', today: 'Onboarding: Payment Stage' },
  { id: 'preparing', word: 'Preparing', owner: 'Operations', st: 'ok', today: 'Onboarding: PAID / RETURNING' },
  { id: 'retreat', word: 'On retreat', owner: 'Facilitator', st: 'ok', today: 'Onboarding: PAID' },
  { id: 'integration', word: 'Integration', owner: 'Integration Guide', st: 'ok', today: 'Onboarding: Post Session' },
  { id: 'retention', word: 'Retention', owner: 'Sales', st: 'pending', today: 'Retention: Re-Intro (Retention Calls)' },
  { id: 'inactive', word: 'Inactive', owner: 'Sales', st: 'paused', exit: true, today: 'Retention: Client – Inactive' },
  { id: 'not-approved', word: 'Not approved', owner: 'Medical Team', st: 'paused', exit: true, today: 'Retention: Medical – Not Approved' },
  { id: 'lost', word: 'Lost', owner: 'Sales', st: 'paused', exit: true, today: 'No stage today (insight I06)' },
]
export const STAGE = Object.fromEntries(STAGES.map((s) => [s.id, s])) as Record<StageId, (typeof STAGES)[number]>
export const ACTIVE_STAGES = STAGES.filter((s) => !s.exit)

export type ProgramId = 'one-off' | 'package-4' | 'scholarship'
export const PROGRAMS: Record<ProgramId, { word: string; sessions: number; price: number }> = {
  'one-off': { word: 'One-off retreat', sessions: 1, price: 9500 },
  'package-4': { word: 'Four-session package', sessions: 4, price: 32000 },
  scholarship: { word: 'Scholarship retreat', sessions: 1, price: 9500 },
}

/** The readiness checklist (insight I09): the forms and acknowledgements the comms timeline sends separately today,
 *  each with a due date counted back from the retreat's first day. Travel's 14 days is a placeholder until Discovery 3. */
export type FormId = 'prep' | 'substance' | 'travel' | 'iv'
export const FORMS: { id: FormId; word: string; daysBefore: number; today: string }[] = [
  { id: 'prep', word: 'Prep Guide acknowledgement', daysBefore: 60, today: 'Prep Guide Acknowledgement Form (FormKit), sent with the −60 day email' },
  { id: 'substance', word: 'Medical Substance form', daysBefore: 42, today: 'Medical Substance email, SF-09' },
  { id: 'travel', word: 'Travel details', daysBefore: 14, today: 'Travel Details – Retreat A / B (FormKit)' },
  { id: 'iv', word: 'IV consent', daysBefore: 7, today: 'IV Consent Form email, SF-10' },
]

export type Channel = 'Elan' | 'Salesperson' | 'Referral partner' | 'Direct inquiry'

export interface Guest {
  id: string
  name: string
  /** how messages greet them; today this shares a field with the referrer (insight I01) */
  greeting: string
  email: string
  home: string
  returning: boolean
  channel: Channel
  referrer?: string
  stage: StageId
  since: Day
  program?: ProgramId
  price?: number
  sessionsUsed: number
  retreatId?: string
  room?: number
  hold?: { retreatId: string; expires: Day }
  integrator?: string
  application: { sent?: Day; received?: Day; reminders: number }
  /** the clinical record: operations sees `status` and `decided`, never `summary` or `flags` (insight I10) */
  medical: { status: 'none' | 'in-review' | 'info' | 'approved' | 'not-approved'; submitted?: Day; decided?: Day; by?: string; summary?: string; flags?: string[] }
  agreement: { sent?: Day; signed?: Day }
  invoice?: { number: string; amount: number; sent: Day; paid?: Day; reminders: number }
  forms: Partial<Record<FormId, { due: Day; done?: Day; chased?: Day }>>
  session?: { notes?: string; notesBy?: string; notesAt?: Day; completed?: Day }
  care: { checkInDue?: Day; checkIn?: Day; calls: number; finalized?: Day }
  les?: { start: Day; week: number; status: 'scheduled' | 'started' | 'completed' | 'unsubscribed' }
  retention?: { callDue: Day; outcome?: 'continue' | 'stop' }
  stays: { retreatId: string; room: number }[]
}

export interface Retreat {
  id: string
  version: 'A' | 'B'
  site: 'Highlands' | 'Europe'
  number: number
  start: Day
  end: Day
  rooms: number
  facilitator: string
}

export const RETREAT_WINDOW = { A: 'Sunday to Wednesday morning', B: 'Wednesday afternoon to Saturday' } as const
export const retreatName = (r: Retreat) => `Retreat ${r.version} · ${r.site} #${r.number}`

export interface Staff {
  name: string
  role: 'Operations' | 'Sales' | 'Medical Team' | 'Facilitator' | 'Integration Guide' | 'Founder' | 'Integrator assignment'
  /** named in the source documents, or invented for the prototype */
  named: boolean
}

export interface OsEvent {
  id: number
  at: Day
  /** NL-OS for automations; a person's name otherwise; the guest themself from the portal */
  actor: string
  auto: boolean
  guestId?: string
  text: string
  /** what this replaces today: a automation flow, or a manual step in the flowchart (blueprint step ids) */
  replaces?: string[]
}

export const INVOICE_PREFIX = 'NL-'

/** A name set mid-sentence: its first letter lowered, unless it starts with an acronym (IV consent) or is a proper
 *  name with more capitals in it (Prep Guide acknowledgement, Medical Substance form). */
export const midSentence = (s: string) => (/^[A-Z]{2}|\s[A-Z]/.test(s) ? s : s.charAt(0).toLowerCase() + s.slice(1))
