// The living state of Northlight OS: guests, retreats and the event log, with every action a person can take and the
// automations that run when the day advances. Each event records what it replaces in today's flowchart (blueprint step
// ids), so the Blueprint can show what the OS took over. Kept in this browser; Reset restores the example data.
import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { addDays, daysBetween, FORMS, midSentence, PROGRAMS, retreatName, weekday, type Day, type FormId, type Guest, type OsEvent, type ProgramId, type Retreat, type StageId } from './model'
import { formsFor, SEED_EVENTS, SEED_GUESTS, SEED_RETREATS, SEED_TODAY } from './seed'

/** How long a medical review may wait before it shows in Needs you (insight I04). A placeholder for Discovery 2. */
export const REVIEW_TARGET_DAYS = 2
/** How long a hold lasts before NL-OS releases it (insight I05). A placeholder for Discovery 4. */
export const HOLD_DAYS = 21
/** Reminders before an application or invoice counts as stalled: four, a week apart (the 11 Aug flowchart). */
export const MAX_REMINDERS = 4

type NewInquiry = Pick<Guest, 'name' | 'greeting' | 'email' | 'home' | 'channel' | 'referrer'>

interface OsState {
  today: Day
  guests: Guest[]
  retreats: Retreat[]
  events: OsEvent[]
  addInquiry(q: NewInquiry, by: string): string
  qualify(id: string, program: ProgramId, retreatId: string, by: string): void
  remindApplication(id: string, by: string): void
  extendHold(id: string, by: string): void
  releaseHold(id: string, by: string): void
  markLost(id: string, by: string): void
  submitApplication(id: string): void
  decide(id: string, outcome: 'approved' | 'not-approved' | 'info', by: string): void
  provideInfo(id: string): void
  signAgreement(id: string): void
  payInvoice(id: string): void
  remindInvoice(id: string, by: string): void
  assignIntegrator(id: string, integrator: string, by: string): void
  completeForm(id: string, form: FormId): void
  chaseForm(id: string, form: FormId, by: string): void
  saveNotes(id: string, notes: string, by: string): void
  markComplete(id: string, by: string): void
  logCheckIn(id: string, by: string): void
  logCall(id: string, by: string): void
  finalizeCare(id: string, by: string): void
  bookNext(id: string, retreatId: string, by: string): void
  retain(id: string, retreatId: string, by: string): void
  stop(id: string, by: string): void
  advanceDay(): void
  reset(): void
}

const seed = () => ({ today: SEED_TODAY, guests: structuredClone(SEED_GUESTS), retreats: structuredClone(SEED_RETREATS), events: structuredClone(SEED_EVENTS) })

/** The first free room on a retreat, or undefined when it is full. */
export function freeRoom(retreat: Retreat, guests: Guest[], except?: string) {
  const taken = new Set(guests.filter((g) => g.id !== except && g.retreatId === retreat.id && g.room && !['inactive', 'not-approved', 'lost'].includes(g.stage)).map((g) => g.room))
  for (let n = 1; n <= retreat.rooms; n++) if (!taken.has(n)) return n
  return undefined
}

/** Retreats a guest can still be booked on: starting at least a week out, with a room free. */
export const openRetreats = (s: Pick<OsState, 'today' | 'retreats' | 'guests'>) =>
  s.retreats.filter((r) => daysBetween(s.today, r.start) >= 7 && freeRoom(r, s.guests) !== undefined)

const nextInvoice = (guests: Guest[]) => `NL-${Math.max(2200, ...guests.map((g) => Number(g.invoice?.number.slice(3)) || 0)) + 1}`
const nextMonday = (d: Day) => addDays(d, ((8 - weekday(d)) % 7) || 7)

export const useOs = create<OsState>()(
  persist(
    (set, get) => {
      /** Change one guest and log what happened, in one step. */
      const act = (id: string, change: (g: Guest, s: OsState) => Partial<Guest>, ...log: Omit<OsEvent, 'id' | 'at' | 'guestId'>[]) =>
        set((s) => {
          const g = s.guests.find((x) => x.id === id)
          if (!g) return s
          const next = { ...g, ...change(g, s) }
          let n = Math.max(0, ...s.events.map((e) => e.id))
          return {
            guests: s.guests.map((x) => (x.id === id ? next : x)),
            events: [...s.events, ...log.map((e) => ({ ...e, id: ++n, at: s.today, guestId: id }))],
          }
        })
      const stage = (st: StageId, s: OsState) => ({ stage: st, since: s.today })
      const guest = (id: string) => get().guests.find((g) => g.id === id)!
      const retreat = (id?: string) => get().retreats.find((r) => r.id === id)
      const OS = (text: string, replaces?: string[]) => ({ actor: 'NL-OS', auto: true, text, replaces })
      const person = (actor: string, text: string, replaces?: string[]) => ({ actor, auto: false, text, replaces })

      /** Signed and paid: the hold becomes a room, and the readiness checklist starts. */
      const confirmIfReady = (id: string) => {
        const g = guest(id)
        if (g.stage !== 'agreement' || !g.agreement.signed || !g.invoice?.paid) return
        const r = retreat(g.hold?.retreatId ?? g.retreatId)
        if (!r) return
        const room = freeRoom(r, get().guests, id)
        const today = get().today
        const forms = formsFor(r.start)
        // a form whose date has already passed is due tomorrow instead
        for (const f of Object.values(forms)) if (f && f.due <= today) f.due = addDays(today, 1)
        act(id, (_, s) => ({ ...stage('preparing', s), retreatId: r.id, room, hold: undefined, forms }),
          OS(`Confirmed ${retreatName(r)}, room ${room ?? 'to be assigned'}. Created a readiness checklist of ${FORMS.length} forms with due dates.`, ['C1', 'C2', 'C3', 'C6', 'C7', 'C8']))
      }

      return {
        ...seed(),

        addInquiry: (q, by) => {
          const id = `g${Date.now().toString(36)}`
          set((s) => ({
            guests: [...s.guests, { ...q, id, returning: false, stage: 'inquiry', since: s.today, sessionsUsed: 0, application: { reminders: 0 }, medical: { status: 'none' }, agreement: {}, forms: {}, care: { calls: 0 }, stays: [] }],
            events: [...s.events, { id: Math.max(0, ...s.events.map((e) => e.id)) + 1, at: s.today, guestId: id, ...person(by, q.channel === 'Direct inquiry' && by === q.name ? 'Sent an inquiry from the website.' : `Added an inquiry from ${q.referrer || q.channel}.`, ['L1', 'L4', 'L5', 'L6', 'S1']) }],
          }))
          return id
        },
        qualify: (id, program, retreatId, by) => {
          const r = retreat(retreatId)!
          act(id, (_, s) => ({ ...stage('application', s), program, price: PROGRAMS[program].price, hold: { retreatId, expires: addDays(s.today, HOLD_DAYS) }, application: { sent: s.today, reminders: 0 } }),
            person(by, `Qualified for the ${PROGRAMS[program].word.toLowerCase()}.`, ['S2', 'S3', 'S4']),
            OS(`Sent the Program Application and held a room on ${retreatName(r)} until ${addDays(get().today, HOLD_DAYS)}.`, ['S5']))
        },
        remindApplication: (id, by) =>
          act(id, (g) => ({ application: { ...g.application, reminders: g.application.reminders + 1 } }), person(by, 'Sent a personal reminder about the application.')),
        extendHold: (id, by) =>
          act(id, (g) => ({ hold: g.hold && { ...g.hold, expires: addDays(g.hold.expires, 14) } }), person(by, 'Extended the room hold by 14 days.')),
        releaseHold: (id, by) =>
          act(id, () => ({ hold: undefined }), person(by, 'Released the room hold.')),
        markLost: (id, by) =>
          act(id, (_, s) => ({ ...stage('lost', s), hold: undefined }), person(by, 'Marked the lead lost.'), OS('Released the room hold and stopped the reminders.')),
        submitApplication: (id) => {
          const g = guest(id)
          act(id, (_, s) => ({ ...stage('review', s), application: { ...g.application, received: s.today }, medical: { status: 'in-review', submitted: s.today, summary: 'Submitted through the guest portal. No flags recorded yet.', flags: [] } }),
            person(g.name, 'Submitted the Program Application.', ['A0']),
            OS(`Opened a medical review for the Medical Team, with a ${REVIEW_TARGET_DAYS}-day target.`, ['A1', 'A2']))
        },
        decide: (id, outcome, by) => {
          const g = guest(id)
          if (outcome === 'approved') {
            const number = nextInvoice(get().guests)
            act(id, (_, s) => ({ ...stage('agreement', s), medical: { ...g.medical, status: 'approved', decided: s.today, by }, agreement: { sent: s.today }, invoice: { number, amount: g.price ?? 0, sent: s.today, reminders: 0 } }),
              person(by, 'Approved the medical review.', ['M2']),
              OS(`Sent the consulting agreement and invoice ${number} together, and asked Rosa for an integrator.`, ['M3', 'M4', 'M5', 'M6', 'M7', 'M8', 'C5']))
          } else if (outcome === 'not-approved') {
            act(id, (_, s) => ({ ...stage('not-approved', s), hold: undefined, medical: { ...g.medical, status: 'not-approved', decided: s.today, by } }),
              person(by, 'Did not approve the medical review.', ['M2']),
              OS('Released the room hold and sent the not-approved letter. The guest leaves the pipeline as Not approved, apart from lapsed clients.', ['M9']))
          } else {
            act(id, () => ({ medical: { ...g.medical, status: 'info' } }), person(by, 'Asked the guest for more medical information.'), OS('Sent the guest a request in their portal, with a reminder in 3 days.'))
          }
        },
        provideInfo: (id) =>
          act(id, (g) => ({ medical: { ...g.medical, status: 'in-review' } }), person(guest(id).name, 'Sent the requested medical information.'), OS('Returned the review to the Medical Team.')),
        signAgreement: (id) => {
          act(id, (g, s) => ({ agreement: { ...g.agreement, signed: s.today } }), person(guest(id).name, 'Signed the consulting agreement in the guest portal.'))
          confirmIfReady(id)
        },
        payInvoice: (id) => {
          act(id, (g, s) => ({ invoice: g.invoice && { ...g.invoice, paid: s.today } }), person(guest(id).name, `Paid invoice ${guest(id).invoice?.number} in the guest portal.`), OS('Recorded the payment against the guest record.', ['C8']))
          confirmIfReady(id)
        },
        remindInvoice: (id, by) =>
          act(id, (g) => ({ invoice: g.invoice && { ...g.invoice, reminders: g.invoice.reminders + 1 } }), person(by, 'Called the guest about the unpaid invoice.')),
        assignIntegrator: (id, integrator, by) =>
          act(id, () => ({ integrator }), person(by, `Assigned ${integrator} as integrator.`, ['C4'])),
        completeForm: (id, form) =>
          act(id, (g, s) => ({ forms: { ...g.forms, [form]: { ...g.forms[form]!, done: s.today } } }), person(guest(id).name, `Completed the ${midSentence(FORMS.find((f) => f.id === form)!.word)}.`)),
        chaseForm: (id, form, by) =>
          act(id, (g, s) => ({ forms: { ...g.forms, [form]: { ...g.forms[form]!, chased: s.today } } }), person(by, `Chased the ${midSentence(FORMS.find((f) => f.id === form)!.word)} by text and email.`)),
        saveNotes: (id, notes, by) =>
          act(id, (g, s) => ({ session: { ...g.session, notes, notesBy: by, notesAt: s.today } }), person(by, 'Saved facilitator session notes.', ['D2']), OS(`Closed ${by}’s 3-day access to the record.`)),
        markComplete: (id, by) => {
          const g = guest(id)
          const first = !g.returning && g.sessionsUsed === 0
          const today = get().today
          act(id, (_, s) => ({
            ...stage('integration', s), session: { ...g.session, completed: s.today }, sessionsUsed: g.sessionsUsed + 1,
            stays: [...g.stays, ...(g.retreatId && g.room ? [{ retreatId: g.retreatId, room: g.room }] : [])],
            care: { checkInDue: addDays(s.today, 2), calls: 0 }, les: first ? { start: nextMonday(s.today), week: 0, status: 'scheduled' } : g.les,
          }),
          person(by, 'Marked the session complete.', ['D3', 'D4']),
          OS(`Sent Elan’s Integration Audio, set Past Client, and scheduled the follow-ups${first ? ` and the Living Well Series from ${nextMonday(today)}` : ''}. The 48-hour check-in is due ${addDays(today, 2)}.`, ['D5', 'D6', ...(first ? ['E1'] : [])]))
        },
        logCheckIn: (id, by) => act(id, (g, s) => ({ care: { ...g.care, checkIn: s.today } }), person(by, 'Logged the post-visit check-in.', ['G1'])),
        logCall: (id, by) => act(id, (g) => ({ care: { ...g.care, calls: g.care.calls + 1 } }), person(by, 'Logged an integration call.', ['G2'])),
        finalizeCare: (id, by) => {
          const g = guest(id)
          const left = g.program ? PROGRAMS[g.program].sessions - g.sessionsUsed : 0
          act(id, (_, s) => ({ care: { ...g.care, finalized: s.today }, ...(left > 0 ? {} : { ...stage('retention', s), retention: { callDue: addDays(g.session?.completed ?? s.today, 7) } }) }),
            person(by, 'Completed the Integration Finalization Form.', ['G2']),
            left > 0
              ? OS(`${left} package session${left === 1 ? '' : 's'} left: the next booking is ready for operations.`, ['K1', 'K2'])
              : OS(`No sessions left: moved to Retention, with Silas’s call due ${addDays(g.session?.completed ?? get().today, 7)}.`, ['K1', 'K2', 'K4']))
        },
        bookNext: (id, retreatId, by) => {
          const r = retreat(retreatId)!
          const room = freeRoom(r, get().guests, id)
          act(id, (_, s) => ({ ...stage('preparing', s), returning: true, retreatId, room, session: undefined, care: { calls: 0 }, forms: formsFor(r.start) }),
            person(by, `Booked the next package session on ${retreatName(r)}.`, ['K3', 'R1', 'R3']),
            OS(`Confirmed room ${room}, carried the package balance and created the readiness checklist.`, ['R2']))
        },
        retain: (id, retreatId, by) => {
          const r = retreat(retreatId)!
          const g = guest(id)
          const number = nextInvoice(get().guests)
          act(id, (_, s) => ({ ...stage('agreement', s), retention: { ...g.retention!, outcome: 'continue' }, returning: true, program: 'one-off', price: PROGRAMS['one-off'].price, hold: { retreatId, expires: addDays(s.today, HOLD_DAYS) }, agreement: { sent: s.today }, invoice: { number, amount: PROGRAMS['one-off'].price, sent: s.today, reminders: 0 }, session: undefined }),
            person(by, 'Retention call: the guest continues.', ['K5', 'K6']),
            OS(`Held a room on ${retreatName(r)} and sent the agreement and invoice ${number}. The Living Well Series status is kept.`, ['K6']))
        },
        stop: (id, by) =>
          act(id, (g, s) => ({ ...stage('inactive', s), retention: g.retention && { ...g.retention, outcome: 'stop' } }), person(by, 'Retention call: the guest stops for now.', ['K5']), OS('Moved to Inactive and stopped marketing messages.', ['K7'])),

        advanceDay: () => {
          const today = addDays(get().today, 1)
          set({ today })
          for (const g of get().guests) {
            const app = g.application
            if (g.stage === 'application' && app.sent && app.reminders < MAX_REMINDERS && daysBetween(app.sent, today) % 7 === 0) {
              const n = app.reminders + 1
              act(g.id, () => ({ application: { ...app, reminders: n } }), OS(n < MAX_REMINDERS ? `Sent application reminder ${n} of ${MAX_REMINDERS}.` : `Sent the last application reminder. The lead now needs a decision from sales.`, ['S6']))
            }
            if (g.hold && g.hold.expires < today) act(g.id, () => ({ hold: undefined }), OS('The room hold expired, so NL-OS released the room.'))
            const inv = g.invoice
            if (g.stage === 'agreement' && inv && !inv.paid && inv.reminders < MAX_REMINDERS && daysBetween(inv.sent, today) % 7 === 0)
              act(g.id, () => ({ invoice: { ...inv, reminders: inv.reminders + 1 } }), OS(`Sent invoice reminder ${inv.reminders + 1} of ${MAX_REMINDERS}.`, ['C9']))
            if (g.stage === 'preparing')
              for (const f of FORMS) {
                const x = g.forms[f.id]
                if (x && !x.done && x.due === today) act(g.id, (h) => ({ forms: { ...h.forms, [f.id]: { ...x, chased: today } } }), OS(`The ${midSentence(f.word)} is due today; sent a reminder by text and email.`, ['P3']))
              }
            const r = retreat(g.retreatId)
            if (g.stage === 'preparing' && r && r.start <= today) act(g.id, (_, s) => stage('retreat', s), OS(`Checked in to ${retreatName(r)}. ${r.facilitator} has access to the record for 3 days.`, ['P5', 'D1']))
            if (g.les && weekday(today) === 1) {
              const l = g.les
              if (l.status === 'scheduled' && l.start <= today) act(g.id, () => ({ les: { ...l, status: 'started', week: 1 } }), OS('Sent week 1 of the Living Well Series.', ['E1', 'E2']))
              else if (l.status === 'started') act(g.id, () => ({ les: { ...l, week: l.week + 1, status: l.week + 1 >= 8 ? 'completed' : 'started' } }), OS(l.week + 1 >= 8 ? 'Sent the last Living Well Series email; marked it completed.' : `Sent week ${l.week + 1} of the Living Well Series.`, ['E2']))
            }
          }
        },
        reset: () => set(seed()),
      }
    },
    { name: 'northlight-os', version: 1 },
  ),
)

export const useGuest = (id?: string) => useOs((s) => s.guests.find((g) => g.id === id))
export const useRetreat = (id?: string) => useOs((s) => s.retreats.find((r) => r.id === id))
