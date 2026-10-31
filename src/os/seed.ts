// The example data the prototype starts from: one guest at every point of the journey, and the exceptions the
// documents predict (a review past its target, a stalled application, an unpaid invoice, an overdue consent, a guest
// with no integrator, a hold about to lapse, a retention call due). Mara, Iris, June, Silas, Elan and Rosa
// are named in the source documents; every guest, price and other staff name is invented.
import { addDays, FORMS, PROGRAMS, type Day, type FormId, type Guest, type OsEvent, type Retreat, type Staff } from './model'

export const SEED_TODAY: Day = '2026-10-30'

export const STAFF: Staff[] = [
  { name: 'Mara', role: 'Operations', named: true },
  { name: 'Iris', role: 'Operations', named: true },
  { name: 'June', role: 'Operations', named: true },
  { name: 'Silas', role: 'Sales', named: true },
  { name: 'Elan', role: 'Founder', named: true },
  { name: 'Rosa', role: 'Integrator assignment', named: true },
  { name: 'Dr. Imani Brooks', role: 'Medical Team', named: false },
  { name: 'Elias Moreno', role: 'Facilitator', named: false },
  { name: 'Noor Haddad', role: 'Facilitator', named: false },
  { name: 'Maya Ruiz', role: 'Integration Guide', named: false },
  { name: 'Jonah Keller', role: 'Integration Guide', named: false },
  { name: 'Lena Sato', role: 'Integration Guide', named: false },
]
export const INTEGRATORS = STAFF.filter((s) => s.role === 'Integration Guide').map((s) => s.name)

const r = (id: string, version: 'A' | 'B', site: 'Highlands' | 'Europe', number: number, start: Day, facilitator: string): Retreat => ({
  id, version, site, number, start, end: addDays(start, 3), rooms: site === 'Highlands' ? 10 : 8, facilitator,
})

export const SEED_RETREATS: Retreat[] = [
  r('A38', 'A', 'Highlands', 38, '2026-10-11', 'Elias Moreno'),
  r('A39', 'A', 'Highlands', 39, '2026-10-18', 'Noor Haddad'),
  r('A40', 'A', 'Highlands', 40, '2026-10-25', 'Elias Moreno'),
  r('B40', 'B', 'Highlands', 40, '2026-10-28', 'Noor Haddad'),
  r('A41', 'A', 'Highlands', 41, '2026-11-01', 'Elias Moreno'),
  r('B41', 'B', 'Highlands', 41, '2026-11-04', 'Noor Haddad'),
  r('E12', 'A', 'Europe', 12, '2026-11-15', 'Elias Moreno'),
  r('A42', 'A', 'Highlands', 42, '2026-12-06', 'Noor Haddad'),
  r('B42', 'B', 'Highlands', 42, '2026-12-09', 'Elias Moreno'),
  r('A43', 'A', 'Highlands', 43, '2027-01-10', 'Noor Haddad'),
]
const start = (id: string) => SEED_RETREATS.find((x) => x.id === id)!.start

/** A booking's readiness checklist, with the named forms already returned. */
export function formsFor(first: Day, done: FormId[] = [], returned?: Day): Guest['forms'] {
  return Object.fromEntries(FORMS.map((f) => {
    const due = addDays(first, -f.daysBefore)
    return [f.id, done.includes(f.id) ? { due, done: returned ?? addDays(due, -2) } : { due }]
  }))
}

const base = { returning: false, sessionsUsed: 0, application: { reminders: 0 }, medical: { status: 'none' as const }, agreement: {}, forms: {}, care: { calls: 0 }, stays: [] }
const inv = (n: number, program: keyof typeof PROGRAMS, sent: Day, paid?: Day, reminders = 0) => ({ number: `NL-${n}`, amount: PROGRAMS[program].price, sent, paid, reminders })

export const SEED_GUESTS: Guest[] = [
  // Sales: a new inquiry and one from a partner, not yet qualified
  { ...base, id: 'g01', name: 'Hannah Price', greeting: 'Hannah', email: 'hannah@example.com', home: 'Austin, TX', channel: 'Direct inquiry', stage: 'inquiry', since: '2026-10-30' },
  { ...base, id: 'g02', name: 'Marcus Bell', greeting: 'Marcus', email: 'marcus@example.com', home: 'Denver, CO', channel: 'Referral partner', referrer: 'Harbor Integrative (partner clinic)', stage: 'inquiry', since: '2026-10-27' },
  // Applications: one on time with a hold about to lapse, one stalled after four reminders
  { ...base, id: 'g03', name: 'Sofia Marin', greeting: 'Sofia', email: 'sofia@example.com', home: 'Miami, FL', channel: 'Salesperson', referrer: 'Silas', stage: 'application', since: '2026-10-21', program: 'one-off', price: 9500,
    hold: { retreatId: 'A42', expires: '2026-11-01' }, application: { sent: '2026-10-21', reminders: 1 } },
  { ...base, id: 'g04', name: 'Theo Grant', greeting: 'Theo', email: 'theo@example.com', home: 'Chicago, IL', channel: 'Elan', referrer: 'Elan', stage: 'application', since: '2026-09-30', program: 'package-4', price: 32000,
    hold: { retreatId: 'B42', expires: '2026-11-12' }, application: { sent: '2026-09-30', reminders: 4 } },
  // Medical review: one inside the target, one past it
  { ...base, id: 'g05', name: 'Priya Nair', greeting: 'Priya', email: 'priya@example.com', home: 'Seattle, WA', channel: 'Referral partner', referrer: 'Dr. Okoro (referring physician)', stage: 'review', since: '2026-10-29', program: 'one-off', price: 9500,
    hold: { retreatId: 'A42', expires: '2026-11-20' }, application: { sent: '2026-10-20', received: '2026-10-29', reminders: 1 },
    medical: { status: 'in-review', submitted: '2026-10-29', summary: 'First retreat. Takes an SSRI daily; history of mild hypertension, controlled.', flags: ['SSRI: confirm taper plan', 'Blood pressure log requested'] } },
  { ...base, id: 'g06', name: 'Daniel Okafor', greeting: 'Daniel', email: 'daniel@example.com', home: 'Atlanta, GA', channel: 'Salesperson', referrer: 'Silas', stage: 'review', since: '2026-10-24', program: 'package-4', price: 32000,
    hold: { retreatId: 'B42', expires: '2026-11-25' }, application: { sent: '2026-10-14', received: '2026-10-24', reminders: 1 },
    medical: { status: 'in-review', submitted: '2026-10-24', summary: 'First retreat. No current medication. Reports a cardiac arrhythmia diagnosed in 2019.', flags: ['Cardiology clearance letter missing'] } },
  // Agreement and payment: one signed and waiting on payment, one unpaid past a week
  { ...base, id: 'g07', name: 'Ava Lindqvist', greeting: 'Ava', email: 'ava@example.com', home: 'Stockholm, SE', channel: 'Elan', referrer: 'Elan', stage: 'agreement', since: '2026-10-27', program: 'one-off', price: 9500,
    hold: { retreatId: 'E12', expires: '2026-11-08' }, integrator: 'Lena Sato', application: { sent: '2026-10-08', received: '2026-10-19', reminders: 1 },
    medical: { status: 'approved', submitted: '2026-10-19', decided: '2026-10-27', by: 'Dr. Imani Brooks' }, agreement: { sent: '2026-10-27', signed: '2026-10-28' }, invoice: inv(2214, 'one-off', '2026-10-27') },
  { ...base, id: 'g08', name: 'Owen Fraser', greeting: 'Owen', email: 'owen@example.com', home: 'Boston, MA', channel: 'Salesperson', referrer: 'Silas', stage: 'agreement', since: '2026-10-20', program: 'scholarship', price: 9500,
    hold: { retreatId: 'A42', expires: '2026-11-15' }, application: { sent: '2026-10-02', received: '2026-10-14', reminders: 1 },
    medical: { status: 'approved', submitted: '2026-10-14', decided: '2026-10-20', by: 'Dr. Imani Brooks' }, agreement: { sent: '2026-10-20' }, invoice: inv(2209, 'scholarship', '2026-10-20', undefined, 1) },
  // Preparing: A41 starts Sunday; one guest still owes IV consent; Europe guest has no integrator
  { ...base, id: 'g09', name: 'Isabel Cruz', greeting: 'Isabel', email: 'isabel@example.com', home: 'San Diego, CA', channel: 'Referral partner', referrer: 'Harbor Integrative (partner clinic)', stage: 'preparing', since: '2026-09-02', program: 'one-off', price: 9500,
    retreatId: 'A41', room: 3, integrator: 'Maya Ruiz', application: { sent: '2026-08-10', received: '2026-08-18', reminders: 1 },
    medical: { status: 'approved', submitted: '2026-08-18', decided: '2026-08-21', by: 'Dr. Imani Brooks' }, agreement: { sent: '2026-08-21', signed: '2026-08-24' }, invoice: inv(2140, 'one-off', '2026-08-21', '2026-09-02'),
    forms: formsFor(start('A41'), ['prep', 'substance', 'travel']) },
  { ...base, id: 'g10', name: 'Ravi Menon', greeting: 'Ravi', email: 'ravi@example.com', home: 'Highlands, TN', channel: 'Elan', referrer: 'Elan', stage: 'preparing', since: '2026-08-28', program: 'one-off', price: 9500,
    retreatId: 'A41', room: 5, integrator: 'Jonah Keller', application: { sent: '2026-08-05', received: '2026-08-12', reminders: 0 },
    medical: { status: 'approved', submitted: '2026-08-12', decided: '2026-08-14', by: 'Dr. Imani Brooks' }, agreement: { sent: '2026-08-14', signed: '2026-08-15' }, invoice: inv(2133, 'one-off', '2026-08-14', '2026-08-28'),
    forms: formsFor(start('A41'), ['prep', 'substance', 'travel', 'iv']) },
  { ...base, id: 'g11', name: 'Clara Weiss', greeting: 'Clara', email: 'clara@example.com', home: 'Zurich, CH', channel: 'Direct inquiry', stage: 'preparing', since: '2026-09-18', program: 'one-off', price: 9500,
    retreatId: 'E12', room: 2, application: { sent: '2026-08-30', received: '2026-09-08', reminders: 1 },
    medical: { status: 'approved', submitted: '2026-09-08', decided: '2026-09-10', by: 'Dr. Imani Brooks' }, agreement: { sent: '2026-09-10', signed: '2026-09-12' }, invoice: inv(2171, 'one-off', '2026-09-10', '2026-09-18'),
    forms: formsFor(start('E12'), ['prep']) },
  // On retreat now: B40, Wednesday to Saturday
  { ...base, id: 'g12', name: 'Julian Moss', greeting: 'Julian', email: 'julian@example.com', home: 'Portland, OR', channel: 'Salesperson', referrer: 'Silas', stage: 'retreat', since: '2026-10-28', program: 'one-off', price: 9500,
    retreatId: 'B40', room: 1, integrator: 'Maya Ruiz', application: { sent: '2026-07-20', received: '2026-07-29', reminders: 1 },
    medical: { status: 'approved', submitted: '2026-07-29', decided: '2026-07-31', by: 'Dr. Imani Brooks' }, agreement: { sent: '2026-07-31', signed: '2026-08-02' }, invoice: inv(2101, 'one-off', '2026-07-31', '2026-08-06'),
    forms: formsFor(start('B40'), ['prep', 'substance', 'travel', 'iv']) },
  { ...base, id: 'g13', name: 'Mei Tanaka', greeting: 'Mei', email: 'mei@example.com', home: 'Los Angeles, CA', channel: 'Elan', referrer: 'Elan', returning: true, stage: 'retreat', since: '2026-10-28', program: 'package-4', price: 32000, sessionsUsed: 1,
    retreatId: 'B40', room: 4, integrator: 'Jonah Keller', application: { sent: '2026-05-02', received: '2026-05-06', reminders: 0 },
    medical: { status: 'approved', submitted: '2026-09-30', decided: '2026-10-01', by: 'Dr. Imani Brooks' }, agreement: { sent: '2026-05-08', signed: '2026-05-09' }, invoice: inv(1988, 'package-4', '2026-05-08', '2026-05-12'),
    forms: formsFor(start('B40'), ['prep', 'substance', 'travel', 'iv']), stays: [{ retreatId: 'A38', room: 4 }] },
  // Integration: A40 ended Wednesday, so the 48-hour check-in is due today; another guest finished earlier
  { ...base, id: 'g14', name: 'Nora Bennett', greeting: 'Nora', email: 'nora@example.com', home: 'Raleigh, NC', channel: 'Referral partner', referrer: 'Dr. Okoro (referring physician)', stage: 'integration', since: '2026-10-28', program: 'one-off', price: 9500,
    retreatId: 'A40', room: 2, integrator: 'Lena Sato', application: { sent: '2026-07-01', received: '2026-07-09', reminders: 1 },
    medical: { status: 'approved', submitted: '2026-07-09', decided: '2026-07-10', by: 'Dr. Imani Brooks' }, agreement: { sent: '2026-07-10', signed: '2026-07-12' }, invoice: inv(2090, 'one-off', '2026-07-10', '2026-07-20'),
    forms: formsFor(start('A40'), ['prep', 'substance', 'travel', 'iv']), session: { notes: 'Steady through all three days. Asked for the integration audio early.', notesBy: 'Elias Moreno', notesAt: '2026-10-28', completed: '2026-10-28' },
    care: { checkInDue: '2026-10-30', calls: 0 }, les: { start: '2026-11-02', week: 0, status: 'scheduled' }, stays: [{ retreatId: 'A40', room: 2 }] },
  { ...base, id: 'g15', name: 'Sam Whitaker', greeting: 'Sam', email: 'sam@example.com', home: 'Phoenix, AZ', channel: 'Salesperson', referrer: 'Silas', returning: true, stage: 'integration', since: '2026-10-14', program: 'package-4', price: 32000, sessionsUsed: 2,
    retreatId: 'A38', room: 6, integrator: 'Maya Ruiz', application: { sent: '2026-03-02', received: '2026-03-06', reminders: 0 },
    medical: { status: 'approved', submitted: '2026-09-20', decided: '2026-09-21', by: 'Dr. Imani Brooks' }, agreement: { sent: '2026-03-08', signed: '2026-03-09' }, invoice: inv(1902, 'package-4', '2026-03-08', '2026-03-15'),
    forms: formsFor(start('A38'), ['prep', 'substance', 'travel', 'iv']), session: { notes: 'Second package session. Good integration from the first.', notesBy: 'Elias Moreno', notesAt: '2026-10-14', completed: '2026-10-14' },
    care: { checkInDue: '2026-10-16', checkIn: '2026-10-16', calls: 2 }, stays: [{ retreatId: 'A31', room: 6 }, { retreatId: 'A38', room: 6 }] },
  // Retention: a one-off guest whose call was due yesterday
  { ...base, id: 'g16', name: 'Leah Brooks', greeting: 'Leah', email: 'leah@example.com', home: 'Charlotte, NC', channel: 'Direct inquiry', stage: 'retention', since: '2026-10-22', program: 'one-off', price: 9500, sessionsUsed: 1,
    retreatId: 'A39', room: 7, integrator: 'Jonah Keller', application: { sent: '2026-08-01', received: '2026-08-05', reminders: 0 },
    medical: { status: 'approved', submitted: '2026-08-05', decided: '2026-08-07', by: 'Dr. Imani Brooks' }, agreement: { sent: '2026-08-07', signed: '2026-08-08' }, invoice: inv(2126, 'one-off', '2026-08-07', '2026-08-12'),
    session: { notes: 'First retreat. Settled by day two.', notesBy: 'Noor Haddad', notesAt: '2026-10-21', completed: '2026-10-21' },
    care: { checkInDue: '2026-10-23', checkIn: '2026-10-23', calls: 3, finalized: '2026-10-22' }, les: { start: '2026-10-26', week: 1, status: 'started' }, retention: { callDue: '2026-10-29' }, stays: [{ retreatId: 'A39', room: 7 }] },
  // Exits
  { ...base, id: 'g17', name: 'Peter Lang', greeting: 'Peter', email: 'peter@example.com', home: 'Vienna, AT', channel: 'Elan', referrer: 'Elan', stage: 'inactive', since: '2026-09-29', program: 'one-off', price: 9500, sessionsUsed: 1,
    medical: { status: 'approved', decided: '2026-06-02', by: 'Dr. Imani Brooks' }, retention: { callDue: '2026-09-28', outcome: 'stop' }, stays: [{ retreatId: 'A33', room: 1 }] },
  { ...base, id: 'g18', name: 'Erin Cole', greeting: 'Erin', email: 'erin@example.com', home: 'Tampa, FL', channel: 'Salesperson', referrer: 'Silas', stage: 'not-approved', since: '2026-10-16', program: 'one-off', price: 9500,
    application: { sent: '2026-10-01', received: '2026-10-09', reminders: 1 }, medical: { status: 'not-approved', submitted: '2026-10-09', decided: '2026-10-16', by: 'Dr. Imani Brooks', summary: 'Active contraindication reported.' } },
]

export const SEED_EVENTS: OsEvent[] = [
  { id: 1, at: '2026-10-28', actor: 'Elias Moreno', auto: false, guestId: 'g14', text: 'Saved facilitator session notes; the 3-day record access closed.', replaces: ['D2'] },
  { id: 2, at: '2026-10-28', actor: 'Mara', auto: false, guestId: 'g14', text: 'Marked the session complete.', replaces: ['D3', 'D4'] },
  { id: 3, at: '2026-10-28', actor: 'NL-OS', auto: true, guestId: 'g14', text: 'Sent Elan’s Integration Audio, set Past Client, scheduled the Living Well Series for Monday, Nov 2, and the 48-hour check-in.', replaces: ['D5', 'D6', 'E1'] },
  { id: 4, at: '2026-10-28', actor: 'Ava Lindqvist', auto: false, guestId: 'g07', text: 'Signed the consulting agreement in the guest portal.' },
  { id: 5, at: '2026-10-29', actor: 'Priya Nair', auto: false, guestId: 'g05', text: 'Submitted the Program Application.', replaces: ['A0'] },
  { id: 6, at: '2026-10-29', actor: 'NL-OS', auto: true, guestId: 'g05', text: 'Opened a medical review for the Medical Team, with a 2-day target.', replaces: ['A1', 'A2'] },
  { id: 7, at: '2026-10-30', actor: 'Hannah Price', auto: false, guestId: 'g01', text: 'Sent an inquiry from the website.', replaces: ['L1', 'L4', 'L5'] },
]
