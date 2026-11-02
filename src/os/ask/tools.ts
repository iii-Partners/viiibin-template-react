// The tools behind Ask. Each one reads a snapshot of Northlight OS's state and returns cards for the person (blocks.ts)
// and a compact summary of the same facts for Claude. The browser runs them, for Claude's tool calls and for the
// built-in matcher alike (local.ts), so both engines show the same cards. Clinical notes and flags never leave here:
// the medical record contributes only its status, dates and the deciding clinician (insight I10).
import { ACTIVE_STAGES, addDays, daysBetween, fmt, FORMS, PROGRAMS, RETREAT_WINDOW, retreatName, STAGE, STAGES, type Guest, type OsEvent, type Retreat, type StageId } from '../model'
import { findNeeds, LENS_WORD, type Lens } from '../needs'
import { MAX_REMINDERS, REVIEW_TARGET_DAYS } from '../store'
import { STAFF } from '../seed'
import { CHAPTERS, INSIGHTS, SESSIONS, STACK, STEPS, STEP_IDS, CVOS } from '../blueprint'
import type { Block, GuestLine, Row, ToolOutput } from './blocks'
import type { Status } from '@/components/system/status'

export type Snapshot = { today: string; guests: Guest[]; retreats: Retreat[]; events: OsEvent[] }
type Input = Record<string, unknown>

// ── reading the model's input tolerantly: a missing or mistyped field falls back to the default ──
const s = (i: Input, k: string) => (typeof i[k] === 'string' && (i[k] as string).trim() ? (i[k] as string).trim() : undefined)
const b = (i: Input, k: string) => (typeof i[k] === 'boolean' ? (i[k] as boolean) : undefined)
const n = (i: Input, k: string, d: number) => (typeof i[k] === 'number' && Number.isFinite(i[k]) && (i[k] as number) > 0 ? Math.round(i[k] as number) : d)
const list = (i: Input, k: string) => (Array.isArray(i[k]) ? (i[k] as unknown[]).filter((x): x is string => typeof x === 'string') : undefined)

// ── shared helpers ──
export const money = (v: number) => `$${Math.round(v).toLocaleString('en-US')}`
const plural = (v: number, one: string, many = `${one}s`) => `${v} ${v === 1 ? one : many}`
const EXITS: StageId[] = ['inactive', 'not-approved', 'lost']
const isActive = (g: Guest) => !EXITS.includes(g.stage)
const stageIndex = (id: StageId) => STAGES.findIndex((x) => x.id === id)
const BOOKED: StageId[] = ['agreement', 'preparing', 'retreat', 'integration', 'retention']
const norm = (t: string) => t.toLowerCase().replace(/[^a-z0-9@. ]+/g, ' ').replace(/\s+/g, ' ').trim()
const rt = (snap: Snapshot, id?: string) => snap.retreats.find((r) => r.id === id)
const booked = (snap: Snapshot, r: Retreat) => snap.guests.filter((g) => g.retreatId === r.id && isActive(g))
const held = (snap: Snapshot, r: Retreat) => snap.guests.filter((g) => g.hold?.retreatId === r.id && !g.retreatId && isActive(g))
const overdueForms = (snap: Snapshot, g: Guest) => FORMS.filter((f) => g.forms[f.id] && !g.forms[f.id]!.done && g.forms[f.id]!.due < snap.today)

export function guestLine(snap: Snapshot, g: Guest): GuestLine {
  const r = rt(snap, g.retreatId ?? g.hold?.retreatId)
  const sub = [g.program && PROGRAMS[g.program].word, r && `${retreatName(r)}${g.hold && !g.retreatId ? ' (held)' : g.room ? `, room ${g.room}` : ''}`].filter(Boolean).join(' · ') || `${g.channel}${g.referrer ? ` via ${g.referrer}` : ''}`
  return { id: g.id, name: g.name, sub, stage: STAGE[g.stage].word, st: STAGE[g.stage].st, returning: g.returning }
}

/** A guest by id, full name, or part of a name ("Isabel", "cruz"). */
export function findGuest(snap: Snapshot, q: string): Guest | undefined {
  const want = norm(q)
  const exact = snap.guests.find((g) => g.id.toLowerCase() === want || norm(g.name) === want)
  if (exact) return exact
  const words = want.split(' ').filter((w) => w.length > 1)
  return snap.guests.find((g) => words.length > 0 && words.every((w) => norm(g.name).includes(w))) ?? snap.guests.find((g) => words.some((w) => w.length > 2 && norm(g.name).split(' ').includes(w)))
}

/** A retreat by id ("A41", "e12"), or by its parts in any order ("Retreat B #41", "Highlands 41", "Europe 12"). */
export function findRetreat(snap: Snapshot, q: string): Retreat | undefined {
  const t = norm(q).replace(/#/g, ' ')
  const byId = snap.retreats.find((r) => t.replace(/\s/g, '') === r.id.toLowerCase())
  if (byId) return byId
  const num = t.match(/(\d+)/)?.[1]
  const version = t.match(/\b(?:retreat\s+)?([ab])\b/)?.[1]?.toUpperCase() ?? t.match(/\b([ab])\s*\d+/)?.[1]?.toUpperCase()
  const site = /europe/.test(t) ? 'Europe' : /highland/.test(t) ? 'Highlands' : undefined
  if (!num) return undefined
  return snap.retreats.find((r) => String(r.number) === num && (!version || r.version === version) && (!site || r.site === site))
}

function needsFor(snap: Snapshot) {
  return findNeeds(snap.today, snap.guests, snap.retreats)
}
const needBlock = (title: string, ns: ReturnType<typeof needsFor>): Block => ({
  kind: 'needs',
  title,
  items: ns.map((x) => ({ key: x.key, st: x.st, word: x.word, title: x.title, why: x.why, guestId: x.guestId, owner: LENS_WORD[x.lens] })),
})
const activityBlock = (snap: Snapshot, title: string, evs: OsEvent[]): Block => ({
  kind: 'activity',
  title,
  items: evs.map((e) => ({ at: fmt(e.at), actor: e.actor, auto: e.auto, text: e.text, guestId: e.guestId, guest: snap.guests.find((g) => g.id === e.guestId)?.name })),
})
const byNewest = (a: OsEvent, b2: OsEvent) => b2.at.localeCompare(a.at) || b2.id - a.id

// ── the tools ──
type Tool = (snap: Snapshot, input: Input) => ToolOutput

const overview: Tool = (snap) => {
  const active = snap.guests.filter(isActive)
  const needs = needsFor(snap)
  const urgent = needs.filter((x) => x.st === 'blocked' || x.st === 'risk')
  const value = active.filter((g) => BOOKED.includes(g.stage) && g.price).reduce((a, g) => a + g.price!, 0)
  const unpaid = snap.guests.filter((g) => g.invoice && !g.invoice.paid)
  const outstanding = unpaid.reduce((a, g) => a + g.invoice!.amount, 0)
  const soon = snap.retreats.filter((r) => r.start >= snap.today && daysBetween(snap.today, r.start) <= 30)
  const rooms = soon.reduce((a, r) => a + r.rooms, 0)
  const filled = soon.reduce((a, r) => a + booked(snap, r).length, 0)
  const stages = ACTIVE_STAGES.map((x) => ({ name: x.word, n: active.filter((g) => g.stage === x.id).length, tone: needs.some((nd) => nd.st === 'blocked' && snap.guests.find((g) => g.id === nd.guestId)?.stage === x.id) ? ('blocked' as const) : ('' as const) }))
  return {
    blocks: [
      {
        kind: 'stats',
        items: [
          { label: 'On the journey', value: String(active.length), sub: `${plural(snap.guests.length - active.length, 'guest')} left` },
          { label: 'Need a person', value: String(needs.length), sub: `${urgent.length} overdue or at risk`, st: urgent.length ? 'risk' : 'ok' },
          { label: 'Booked value', value: money(value), sub: 'Agreement stage onward' },
          { label: 'Outstanding', value: money(outstanding), sub: plural(unpaid.length, 'unpaid invoice'), st: unpaid.length ? 'risk' : 'ok' },
          { label: 'Rooms, next 30 days', value: `${filled}/${rooms}`, sub: `${plural(soon.length, 'retreat')} starting` },
        ],
      },
      { kind: 'stages', title: 'Guests by stage', code: 'JRN', stages },
      needBlock('Most urgent', needs.slice(0, 4)),
    ],
    data: { today: snap.today, onJourney: active.length, needs: needs.length, urgent: urgent.length, bookedValue: value, outstanding, unpaidInvoices: unpaid.length, next30Days: { retreats: soon.length, roomsBooked: filled, rooms }, byStage: Object.fromEntries(stages.map((x) => [x.name, x.n])), topNeeds: needs.slice(0, 4).map((x) => x.title) },
  }
}

const pipeline: Tool = (snap, input) => {
  const active = snap.guests.filter(isActive)
  const at = ACTIVE_STAGES.map((x) => ({ name: x.word, n: active.filter((g) => g.stage === x.id).length }))
  const reached = ACTIVE_STAGES.map((x) => active.filter((g) => stageIndex(g.stage) >= stageIndex(x.id)).length)
  const moves = ACTIVE_STAGES.slice(1).map((x, i) => ({ name: `${ACTIVE_STAGES[i].word} → ${x.word}`, v: reached[i] ? Math.round((reached[i + 1] / reached[i]) * 100) : 0 }))
  const exits = EXITS.map((id) => ({ label: STAGE[id].word, value: String(snap.guests.filter((g) => g.stage === id).length) }))
  const blocks: Block[] = [
    { kind: 'stages', title: 'Guests at each stage now', code: 'JRN', meta: 'Each stage is one field with a date.', stages: at },
    { kind: 'bars', title: 'Share of guests that are at or past the next stage', max: 100, rows: moves.map((m) => ({ name: m.name, v: m.v, label: `${m.v}%`, tone: m.v < 60 ? 'watch' : undefined })) },
  ]
  if (b(input, 'include_exits')) blocks.push({ kind: 'stats', title: 'Left the journey', items: exits })
  return { blocks, data: { atStage: Object.fromEntries(at.map((x) => [x.name, x.n])), stepThrough: moves, left: Object.fromEntries(exits.map((x) => [x.label, x.value])) } }
}

const findGuests: Tool = (snap, input) => {
  const stages = list(input, 'stages')
  const channel = s(input, 'channel')
  const referrer = s(input, 'referrer')?.toLowerCase()
  const r = s(input, 'retreat') ? findRetreat(snap, s(input, 'retreat')!) : undefined
  const program = s(input, 'program')
  const returning = b(input, 'returning')
  const integrator = s(input, 'integrator')?.toLowerCase()
  const text = s(input, 'text') ? norm(s(input, 'text')!) : undefined
  const limit = n(input, 'limit', 25)
  const rows = snap.guests
    .filter((g) => (stages?.length ? stages.includes(g.stage) : isActive(g)))
    .filter((g) => !channel || g.channel === channel)
    .filter((g) => !referrer || g.referrer?.toLowerCase().includes(referrer))
    .filter((g) => !r || g.retreatId === r.id || g.hold?.retreatId === r.id)
    .filter((g) => !program || g.program === program)
    .filter((g) => returning === undefined || g.returning === returning)
    .filter((g) => !integrator || g.integrator?.toLowerCase().includes(integrator))
    .filter((g) => !b(input, 'overdue_forms') || overdueForms(snap, g).length > 0)
    .filter((g) => !b(input, 'unpaid') || (g.invoice && !g.invoice.paid))
    .filter((g) => !text || norm(`${g.name} ${g.email} ${g.home}`).includes(text))
    .sort((a, c) => stageIndex(a.stage) - stageIndex(c.stage) || a.since.localeCompare(c.since))
  const shown = rows.slice(0, limit)
  const filters = [stages?.map((x) => STAGE[x as StageId]?.word ?? x).join(', '), channel, referrer && `referred by “${s(input, 'referrer')}”`, r && retreatName(r), program && PROGRAMS[program as keyof typeof PROGRAMS]?.word, returning === true ? 'returning' : returning === false ? 'first-time' : '', integrator && `with ${s(input, 'integrator')}`, b(input, 'overdue_forms') && 'forms overdue', b(input, 'unpaid') && 'unpaid', text && `matching “${s(input, 'text')}”`].filter(Boolean).join(' · ')
  return {
    blocks: rows.length
      ? [{ kind: 'guests', title: `${plural(rows.length, 'guest')}${filters ? ` · ${filters}` : ''}`, rows: shown.map((g) => guestLine(snap, g)), more: rows.length - shown.length || undefined }]
      : [{ kind: 'note', title: 'No guests match', text: `No guest matches ${filters || 'these filters'} right now.` }],
    data: { count: rows.length, guests: shown.map((g) => ({ id: g.id, name: g.name, stage: STAGE[g.stage].word, since: g.since, channel: g.channel, referrer: g.referrer, retreat: rt(snap, g.retreatId ?? g.hold?.retreatId)?.id, program: g.program, overdueForms: overdueForms(snap, g).map((f) => f.word), unpaid: g.invoice && !g.invoice.paid ? g.invoice.amount : undefined })) },
  }
}

const guestProfile: Tool = (snap, input) => {
  const q = s(input, 'guest') ?? ''
  const g = findGuest(snap, q)
  if (!g) {
    return {
      blocks: [{ kind: 'note', title: `No guest called “${q}”`, text: `The guests on record are ${snap.guests.map((x) => x.name).join(', ')}.` }],
      data: { found: false, guests: snap.guests.map((x) => x.name) },
    }
  }
  const r = rt(snap, g.retreatId ?? g.hold?.retreatId)
  const cur = stageIndex(g.stage)
  const exit = EXITS.includes(g.stage)
  const journey = ACTIVE_STAGES.map((x, i) => ({ title: x.word, sub: i === cur ? `Since ${fmt(g.since)}` : undefined, tone: exit ? ('' as const) : i < cur ? ('done' as const) : i === cur ? ('lit' as const) : ('' as const) }))
  const med = { none: 'Not yet applied', 'in-review': `In review since ${g.medical.submitted ? fmt(g.medical.submitted) : '—'}`, info: 'More information requested', approved: `Approved ${g.medical.decided ? fmt(g.medical.decided) : ''}${g.medical.by ? ` · ${g.medical.by}` : ''}`, 'not-approved': `Not approved ${g.medical.decided ? fmt(g.medical.decided) : ''}` }[g.medical.status]
  const facts = [
    { label: 'In this stage', value: `${plural(daysBetween(g.since, snap.today), 'day')} (since ${fmt(g.since)})` },
    { label: 'Came through', value: `${g.channel}${g.referrer ? ` · ${g.referrer}` : ''}` },
    { label: 'Program', value: g.program ? `${PROGRAMS[g.program].word} · ${money(g.price ?? PROGRAMS[g.program].price)}` : 'Not chosen yet' },
    { label: 'Retreat', value: r ? `${retreatName(r)} · ${fmt(r.start)}${g.room ? ` · room ${g.room}` : g.hold ? ` · held until ${fmt(g.hold.expires)}` : ''}` : 'None yet' },
    { label: 'Medical', value: med },
    { label: 'Agreement', value: g.agreement.signed ? `Signed ${fmt(g.agreement.signed)}` : g.agreement.sent ? `Sent ${fmt(g.agreement.sent)}, not signed` : 'Not sent' },
    { label: 'Invoice', value: g.invoice ? `${g.invoice.number} · ${money(g.invoice.amount)} · ${g.invoice.paid ? `paid ${fmt(g.invoice.paid)}` : `unpaid ${plural(daysBetween(g.invoice.sent, snap.today), 'day')}, ${plural(g.invoice.reminders, 'reminder')}`}` : 'Not sent' },
    { label: 'Integrator', value: g.integrator ?? 'Not assigned' },
    ...(g.program === 'package-4' ? [{ label: 'Sessions used', value: `${g.sessionsUsed} of 4` }] : []),
    ...(g.care.checkInDue || g.care.calls ? [{ label: 'Care', value: [g.care.checkIn ? `Check-in ${fmt(g.care.checkIn)}` : g.care.checkInDue ? `Check-in due ${fmt(g.care.checkInDue)}` : '', plural(g.care.calls, 'call'), g.care.finalized ? `finalized ${fmt(g.care.finalized)}` : ''].filter(Boolean).join(' · ') }] : []),
    { label: 'Contact', value: [g.email, g.home].filter(Boolean).join(' · ') || '—' },
  ]
  const forms = FORMS.filter((f) => g.forms[f.id]).map((f) => ({ word: f.word, due: fmt(g.forms[f.id]!.due), state: g.forms[f.id]!.done ? ('done' as const) : g.forms[f.id]!.due < snap.today ? ('late' as const) : ('open' as const) }))
  const needs = needsFor(snap).filter((x) => x.guestId === g.id)
  const evs = snap.events.filter((e) => e.guestId === g.id).sort(byNewest).slice(0, 6)
  const blocks: Block[] = [{ kind: 'guest', id: g.id, name: g.name, headline: guestLine(snap, g).sub, stage: STAGE[g.stage].word, st: STAGE[g.stage].st, facts, journey, forms }]
  if (needs.length) blocks.push(needBlock(`What ${g.greeting || g.name.split(' ')[0]} needs`, needs))
  if (evs.length) blocks.push(activityBlock(snap, 'Recent activity', evs))
  return { blocks, data: { found: true, name: g.name, stage: STAGE[g.stage].word, ...Object.fromEntries(facts.map((f) => [f.label, f.value])), forms: forms.map((f) => `${f.word}: ${f.state}, due ${f.due}`), needs: needs.map((x) => x.title), recent: evs.map((e) => `${fmt(e.at)} ${e.actor}: ${e.text}`) } }
}

const needsTool: Tool = (snap, input) => {
  const lens = s(input, 'lens') as Lens | undefined
  let ns = needsFor(snap)
  if (lens && lens in LENS_WORD) ns = ns.filter((x) => x.lens === lens)
  if (b(input, 'urgent_only')) ns = ns.filter((x) => x.st === 'blocked' || x.st === 'risk')
  const all = needsFor(snap)
  const lenses = (Object.keys(LENS_WORD) as Lens[]).map((l) => ({ l, c: all.filter((x) => x.lens === l).length })).filter((x) => x.c)
  const blocks: Block[] = []
  if (!lens) blocks.push({ kind: 'fan', title: 'Who it waits on', total: String(all.length), totalLabel: 'Things need a person', sub: `${all.filter((x) => x.st === 'blocked' || x.st === 'risk').length} overdue or at risk`, parts: lenses.map((x) => ({ name: LENS_WORD[x.l], value: String(x.c), share: x.c / all.length })) })
  blocks.push(ns.length ? needBlock(`${lens ? LENS_WORD[lens] : 'Everything'} · ${ns.length}`, ns) : { kind: 'note', text: `Nothing waits on ${lens ? LENS_WORD[lens] : 'anyone'} right now.` })
  return { blocks, data: { count: ns.length, items: ns.map((x) => ({ owner: LENS_WORD[x.lens], status: x.word, title: x.title, why: x.why })) } }
}

function retreatItem(snap: Snapshot, r: Retreat) {
  const bk = booked(snap, r).length
  const hd = held(snap, r).length
  const days = daysBetween(snap.today, r.start)
  const st: Status = r.end < snap.today ? 'done' : days <= 14 && bk / r.rooms < 0.5 ? 'risk' : 'ok'
  return { id: r.id, name: retreatName(r), when: `${r.start <= snap.today && r.end >= snap.today ? 'On now' : days > 0 ? `In ${plural(days, 'day')}` : 'Ended'} · ${fmt(r.start)}–${fmt(r.end)}`, window: RETREAT_WINDOW[r.version], facilitator: r.facilitator, booked: bk, held: hd, rooms: r.rooms, st }
}

const retreats: Tool = (snap, input) => {
  const w = s(input, 'window') ?? 'upcoming'
  const site = s(input, 'site')
  const rs = snap.retreats
    .filter((r) => (w === 'past' ? r.end < snap.today : w === 'all' ? true : w === 'this_week' ? r.end >= snap.today && daysBetween(snap.today, r.start) <= 7 : w === 'this_month' ? r.end >= snap.today && daysBetween(snap.today, r.start) <= 31 : r.end >= snap.today))
    .filter((r) => !site || r.site === site)
    .sort((a, c) => a.start.localeCompare(c.start))
  const items = rs.map((r) => retreatItem(snap, r))
  const rooms = items.reduce((a, x) => a + x.rooms, 0)
  const bk = items.reduce((a, x) => a + x.booked, 0)
  if (!items.length) return { blocks: [{ kind: 'note', text: 'No retreats in that window.' }], data: { count: 0 } }
  return {
    blocks: [
      { kind: 'stats', items: [{ label: 'Retreats', value: String(items.length) }, { label: 'Rooms booked', value: `${bk}/${rooms}`, sub: `${rooms ? Math.round((bk / rooms) * 100) : 0}% full` }, { label: 'Rooms held', value: String(items.reduce((a, x) => a + x.held, 0)), sub: 'Waiting on the guest' }, { label: 'Rooms free', value: String(rooms - bk - items.reduce((a, x) => a + x.held, 0)) }] },
      { kind: 'bars', title: 'Rooms booked', max: Math.max(...items.map((x) => x.rooms)), rows: items.map((x) => ({ name: `${x.id} · ${fmt(snap.retreats.find((r) => r.id === x.id)!.start)}${x.held ? ` · ${x.held} held` : ''}`, v: x.booked, label: `${x.booked}/${x.rooms}`, tone: x.st === 'risk' ? 'watch' : x.st === 'done' ? 'done' : undefined, retreatId: x.id })) },
      { kind: 'retreats', title: 'Retreats', items },
    ],
    data: { retreats: items.map(({ id, name, when, facilitator, booked: bkd, held: hd, rooms: rm }) => ({ id, name, when, facilitator, booked: bkd, held: hd, rooms: rm })) },
  }
}

const retreatDetail: Tool = (snap, input) => {
  const q = s(input, 'retreat') ?? ''
  const r = findRetreat(snap, q)
  if (!r) return { blocks: [{ kind: 'note', title: `No retreat “${q}”`, text: `Retreats on the calendar: ${snap.retreats.map((x) => `${x.id} (${retreatName(x)}, ${fmt(x.start)})`).join('; ')}.` }], data: { found: false, retreats: snap.retreats.map((x) => x.id) } }
  const bk = booked(snap, r).sort((a, c) => (a.room ?? 99) - (c.room ?? 99))
  const hd = held(snap, r)
  const days = daysBetween(snap.today, r.start)
  const rows: Row[] = [
    ...bk.map((g) => {
      const late = overdueForms(snap, g)
      const done = FORMS.filter((f) => g.forms[f.id]?.done).length
      return { guestId: g.id, st: late.length ? ('blocked' as Status) : undefined, cells: { room: g.room ?? '—', guest: g.name, stage: STAGE[g.stage].word, forms: late.length ? `${done}/4 · ${late.length} late` : `${done}/4`, invoice: g.invoice ? (g.invoice.paid ? 'Paid' : `Unpaid ${money(g.invoice.amount)}`) : '—' } }
    }),
    ...hd.map((g) => ({ guestId: g.id, st: 'pending' as Status, cells: { room: 'Held', guest: g.name, stage: STAGE[g.stage].word, forms: '—', invoice: `Hold ends ${fmt(g.hold!.expires)}` } })),
  ]
  const share = bk.length / r.rooms
  return {
    blocks: [
      { kind: 'ring', title: retreatName(r), value: share, plan: (bk.length + hd.length) / r.rooms, big: `${bk.length}/${r.rooms}`, unit: 'Rooms booked', sub: `${hd.length} held · ${r.rooms - bk.length - hd.length} free`, st: days <= 14 && share < 0.5 && days >= 0 ? 'risk' : 'ok', note: `${days > 0 ? `Starts in ${plural(days, 'day')}` : r.end >= snap.today ? 'On now' : 'Ended'} · ${fmt(r.start)}–${fmt(r.end)} · ${RETREAT_WINDOW[r.version]} · ${r.facilitator}` },
      rows.length ? { kind: 'table', title: 'Roster', columns: [{ key: 'room', label: 'Room' }, { key: 'guest', label: 'Guest' }, { key: 'stage', label: 'Stage' }, { key: 'forms', label: 'Forms' }, { key: 'invoice', label: 'Invoice', align: 'right' }], rows } : { kind: 'note', text: 'No guest is booked or held on this retreat yet.' },
    ],
    data: { found: true, id: r.id, name: retreatName(r), start: r.start, end: r.end, facilitator: r.facilitator, rooms: r.rooms, booked: bk.map((g) => ({ name: g.name, room: g.room, overdueForms: overdueForms(snap, g).map((f) => f.word), unpaid: !!g.invoice && !g.invoice.paid })), held: hd.map((g) => ({ name: g.name, expires: g.hold!.expires })) },
  }
}

const revenue: Tool = (snap, input) => {
  const by = s(input, 'group_by') ?? 'program'
  const priced = snap.guests.filter((g) => isActive(g) && BOOKED.includes(g.stage) && (g.price || g.program))
  const val = (g: Guest) => g.price ?? (g.program ? PROGRAMS[g.program].price : 0)
  const total = priced.reduce((a, g) => a + val(g), 0)
  const invoiced = snap.guests.filter((g) => g.invoice)
  const paid = invoiced.filter((g) => g.invoice!.paid).reduce((a, g) => a + g.invoice!.amount, 0)
  const unpaid = invoiced.filter((g) => !g.invoice!.paid).sort((a, c) => a.invoice!.sent.localeCompare(c.invoice!.sent))
  const outstanding = unpaid.reduce((a, g) => a + g.invoice!.amount, 0)
  const key = (g: Guest) => (by === 'channel' ? g.channel : by === 'retreat' ? (rt(snap, g.retreatId)?.id ?? 'No retreat yet') : by === 'status' ? (g.invoice ? (g.invoice.paid ? 'Paid' : 'Unpaid') : 'Not invoiced') : g.program ? PROGRAMS[g.program].word : 'No program')
  const groups = new Map<string, { v: number; c: number }>()
  for (const g of priced) {
    const k = key(g)
    const x = groups.get(k) ?? { v: 0, c: 0 }
    groups.set(k, { v: x.v + val(g), c: x.c + 1 })
  }
  const parts = [...groups.entries()].sort((a, c) => c[1].v - a[1].v).map(([name, x]) => ({ name, value: money(x.v), note: plural(x.c, 'guest'), share: total ? x.v / total : 0, st: name === 'Unpaid' ? ('risk' as Status) : undefined }))
  return {
    blocks: [
      { kind: 'stats', items: [{ label: 'Booked value', value: money(total), sub: plural(priced.length, 'guest') }, { label: 'Paid', value: money(paid) }, { label: 'Outstanding', value: money(outstanding), sub: plural(unpaid.length, 'invoice'), st: unpaid.length ? 'risk' : 'ok' }, { label: 'Average booking', value: priced.length ? money(total / priced.length) : '—' }] },
      { kind: 'fan', title: `Booked value by ${by}`, total: money(total), totalLabel: 'Booked value', sub: 'Guests from the agreement stage onward', parts },
      ...(unpaid.length ? [{ kind: 'table' as const, title: 'Unpaid invoices', columns: [{ key: 'invoice', label: 'Invoice' }, { key: 'guest', label: 'Guest' }, { key: 'amount', label: 'Amount', align: 'right' as const }, { key: 'age', label: 'Age', align: 'right' as const }, { key: 'reminders', label: 'Reminders', align: 'right' as const }, { key: 'agreement', label: 'Agreement' }], rows: unpaid.map((g) => ({ guestId: g.id, st: (daysBetween(g.invoice!.sent, snap.today) >= 7 ? 'risk' : undefined) as Status | undefined, cells: { invoice: g.invoice!.number, guest: g.name, amount: money(g.invoice!.amount), age: plural(daysBetween(g.invoice!.sent, snap.today), 'day'), reminders: `${g.invoice!.reminders}/${MAX_REMINDERS}`, agreement: g.agreement.signed ? 'Signed' : 'Not signed' } })) }] : []),
    ],
    data: { bookedValue: total, paid, outstanding, groupedBy: by, groups: Object.fromEntries([...groups.entries()].map(([k, x]) => [k, { value: x.v, guests: x.c }])), unpaid: unpaid.map((g) => ({ invoice: g.invoice!.number, guest: g.name, amount: g.invoice!.amount, daysOld: daysBetween(g.invoice!.sent, snap.today), reminders: g.invoice!.reminders, agreementSigned: !!g.agreement.signed })) },
  }
}

const channels: Tool = (snap) => {
  const all = snap.guests
  const chans = ['Referral partner', 'Direct inquiry', 'Salesperson', 'Elan'] as const
  const rows = chans.map((c) => {
    const gs = all.filter((g) => g.channel === c)
    return { c, total: gs.length, booked: gs.filter((g) => BOOKED.includes(g.stage)).length, early: gs.filter((g) => ['inquiry', 'application', 'review'].includes(g.stage)).length, left: gs.filter((g) => EXITS.includes(g.stage)).length }
  }).filter((x) => x.total)
  const refs = new Map<string, number>()
  for (const g of all) if (g.referrer) refs.set(g.referrer, (refs.get(g.referrer) ?? 0) + 1)
  const refRows = [...refs.entries()].sort((a, c) => c[1] - a[1])
  return {
    blocks: [
      { kind: 'fan', title: 'Where guests come from', total: String(all.length), totalLabel: 'Guests on record', parts: rows.map((x) => ({ name: x.c, value: String(x.total), note: `${x.booked} booked`, share: x.total / all.length })) },
      { kind: 'table', title: 'By channel', columns: [{ key: 'channel', label: 'Channel' }, { key: 'total', label: 'Guests', align: 'right' }, { key: 'early', label: 'Before booking', align: 'right' }, { key: 'booked', label: 'Booked', align: 'right' }, { key: 'left', label: 'Left', align: 'right' }, { key: 'rate', label: 'Booked share', align: 'right' }], rows: rows.map((x) => ({ cells: { channel: x.c, total: x.total, early: x.early, booked: x.booked, left: x.left, rate: `${Math.round((x.booked / x.total) * 100)}%` } })) },
      ...(refRows.length ? [{ kind: 'bars' as const, title: 'Guests by referrer', max: Math.max(...refRows.map((x) => x[1])), rows: refRows.map(([name, v]) => ({ name, v, label: plural(v, 'guest') })) }] : []),
    ],
    data: { byChannel: rows, byReferrer: Object.fromEntries(refRows) },
  }
}

const medicalReviews: Tool = (snap) => {
  const queue = snap.guests.filter((g) => g.stage === 'review' && ['in-review', 'info'].includes(g.medical.status)).sort((a, c) => (a.medical.submitted ?? '').localeCompare(c.medical.submitted ?? ''))
  const wait = (g: Guest) => (g.medical.submitted ? daysBetween(g.medical.submitted, snap.today) : 0)
  const decided = snap.guests.filter((g) => g.medical.decided && ['approved', 'not-approved'].includes(g.medical.status))
  const approved = decided.filter((g) => g.medical.status === 'approved').length
  const recent = decided.filter((g) => daysBetween(g.medical.decided!, snap.today) <= 30).sort((a, c) => c.medical.decided!.localeCompare(a.medical.decided!))
  const late = queue.filter((g) => wait(g) > REVIEW_TARGET_DAYS)
  return {
    blocks: [
      { kind: 'stats', items: [{ label: 'Waiting for a decision', value: String(queue.length) }, { label: 'Past the 2-day target', value: String(late.length), st: late.length ? 'blocked' : 'ok' }, { label: 'Decided, last 30 days', value: String(recent.length) }, { label: 'Approval rate', value: decided.length ? `${Math.round((approved / decided.length) * 100)}%` : '—', sub: `${approved} of ${decided.length} decisions` }] },
      queue.length ? { kind: 'bars', title: 'Days waiting', max: Math.max(REVIEW_TARGET_DAYS * 2, ...queue.map(wait)), mark: REVIEW_TARGET_DAYS, markLabel: `Target ${REVIEW_TARGET_DAYS} days`, rows: queue.map((g) => ({ name: g.name, v: wait(g), label: `${plural(wait(g), 'day')}${g.medical.status === 'info' ? ' · info requested' : ''}`, tone: wait(g) > REVIEW_TARGET_DAYS ? 'blocked' : undefined, guestId: g.id })) } : { kind: 'note', text: 'No application waits on the Medical Team.' },
      ...(recent.length ? [{ kind: 'table' as const, title: 'Recent decisions', columns: [{ key: 'guest', label: 'Guest' }, { key: 'decision', label: 'Decision' }, { key: 'date', label: 'Decided', align: 'right' as const }, { key: 'by', label: 'By' }], rows: recent.map((g) => ({ guestId: g.id, cells: { guest: g.name, decision: g.medical.status === 'approved' ? 'Approved' : 'Not approved', date: fmt(g.medical.decided!), by: g.medical.by ?? '—' } })) }] : []),
    ],
    data: { targetDays: REVIEW_TARGET_DAYS, queue: queue.map((g) => ({ name: g.name, daysWaiting: wait(g), status: g.medical.status })), decidedLast30: recent.length, approvalRate: decided.length ? approved / decided.length : null },
  }
}

const readiness: Tool = (snap, input) => {
  const r = s(input, 'retreat') ? findRetreat(snap, s(input, 'retreat')!) : undefined
  const gs = snap.guests.filter((g) => isActive(g) && FORMS.some((f) => g.forms[f.id]) && (!r || g.retreatId === r.id))
  const per = FORMS.map((f) => {
    const x = gs.filter((g) => g.forms[f.id])
    const done = x.filter((g) => g.forms[f.id]!.done).length
    const late = x.filter((g) => !g.forms[f.id]!.done && g.forms[f.id]!.due < snap.today).length
    return { f, total: x.length, done, late, open: x.length - done - late }
  })
  const lateGuests = gs.filter((g) => overdueForms(snap, g).length)
  return {
    blocks: [
      { kind: 'stats', title: r ? retreatName(r) : undefined, items: [{ label: 'Guests with a checklist', value: String(gs.length) }, { label: 'Forms returned', value: `${per.reduce((a, x) => a + x.done, 0)}/${per.reduce((a, x) => a + x.total, 0)}` }, { label: 'Overdue', value: String(per.reduce((a, x) => a + x.late, 0)), sub: plural(lateGuests.length, 'guest'), st: lateGuests.length ? 'blocked' : 'ok' }] },
      { kind: 'table', title: 'Each form', columns: [{ key: 'form', label: 'Form' }, { key: 'due', label: 'Due before retreat', align: 'right' }, { key: 'done', label: 'Returned', align: 'right' }, { key: 'open', label: 'Not yet due', align: 'right' }, { key: 'late', label: 'Overdue', align: 'right' }], rows: per.map((x) => ({ st: x.late ? ('blocked' as Status) : undefined, cells: { form: x.f.word, due: `${x.f.daysBefore} days`, done: x.done, open: x.open, late: x.late } })) },
      lateGuests.length ? { kind: 'guests', title: 'Guests with forms overdue', rows: lateGuests.map((g) => ({ ...guestLine(snap, g), sub: `Owes ${overdueForms(snap, g).map((f) => f.word).join(', ')}` })) } : { kind: 'note', text: 'Every checklist is on time.' },
    ],
    data: { retreat: r?.id, forms: per.map((x) => ({ form: x.f.word, returned: x.done, notYetDue: x.open, overdue: x.late })), overdue: lateGuests.map((g) => ({ name: g.name, owes: overdueForms(snap, g).map((f) => f.word) })) },
  }
}

const care: Tool = (snap) => {
  const integ = snap.guests.filter((g) => g.stage === 'integration')
  const checkDue = integ.filter((g) => g.care.checkInDue && !g.care.checkIn && g.care.checkInDue <= snap.today)
  const notesLate = snap.guests.filter((g) => g.stage === 'retreat' && rt(snap, g.retreatId) && rt(snap, g.retreatId)!.end < snap.today && !g.session?.notes)
  const retention = snap.guests.filter((g) => g.stage === 'retention' && g.retention && !g.retention.outcome)
  const les = snap.guests.filter((g) => g.les)
  const lesStates = ['scheduled', 'started', 'completed', 'unsubscribed'].map((st) => ({ st, c: les.filter((g) => g.les!.status === st).length })).filter((x) => x.c)
  const rows: Row[] = integ.map((g) => ({ guestId: g.id, st: checkDue.includes(g) ? ('blocked' as Status) : undefined, cells: { guest: g.name, guide: g.integrator ?? 'Not assigned', checkin: g.care.checkIn ? `Done ${fmt(g.care.checkIn)}` : g.care.checkInDue ? `Due ${fmt(g.care.checkInDue)}` : '—', calls: g.care.calls, finalized: g.care.finalized ? fmt(g.care.finalized) : '—' } }))
  return {
    blocks: [
      { kind: 'stats', items: [{ label: 'In integration', value: String(integ.length) }, { label: 'Check-ins due', value: String(checkDue.length), st: checkDue.length ? 'blocked' : 'ok' }, { label: 'Session notes late', value: String(notesLate.length), st: notesLate.length ? 'blocked' : 'ok' }, { label: 'Retention calls open', value: String(retention.length), sub: `${retention.filter((g) => g.retention!.callDue <= snap.today).length} due now` }] },
      rows.length ? { kind: 'table', title: 'Integration care', columns: [{ key: 'guest', label: 'Guest' }, { key: 'guide', label: 'Integration Guide' }, { key: 'checkin', label: '48-hour check-in' }, { key: 'calls', label: 'Calls', align: 'right' }, { key: 'finalized', label: 'Finalized', align: 'right' }], rows } : { kind: 'note', text: 'No guest is in integration right now.' },
      ...(lesStates.length ? [{ kind: 'fan' as const, title: 'Living Well Series', total: String(les.length), totalLabel: 'Guests enrolled', parts: lesStates.map((x) => ({ name: x.st.charAt(0).toUpperCase() + x.st.slice(1), value: String(x.c), share: x.c / les.length, st: x.st === 'unsubscribed' ? ('paused' as Status) : undefined })) }] : []),
      ...(notesLate.length ? [{ kind: 'guests' as const, title: 'Session notes late', rows: notesLate.map((g) => ({ ...guestLine(snap, g), sub: `${rt(snap, g.retreatId)!.facilitator} · retreat ended ${fmt(rt(snap, g.retreatId)!.end)}` })) }] : []),
    ],
    data: { integration: integ.map((g) => ({ name: g.name, guide: g.integrator, checkIn: g.care.checkIn ?? `due ${g.care.checkInDue}`, calls: g.care.calls, finalized: g.care.finalized })), checkInsDue: checkDue.map((g) => g.name), notesLate: notesLate.map((g) => g.name), retentionCalls: retention.map((g) => ({ name: g.name, due: g.retention!.callDue })), livingWell: Object.fromEntries(lesStates.map((x) => [x.st, x.c])) },
  }
}

const staffWorkload: Tool = (snap) => {
  const guides = STAFF.filter((x) => x.role === 'Integration Guide').map((x) => ({ name: x.name, n: snap.guests.filter((g) => g.integrator === x.name && isActive(g) && ['agreement', 'preparing', 'retreat', 'integration'].includes(g.stage)).length }))
  const facs = STAFF.filter((x) => x.role === 'Facilitator').map((x) => {
    const rs = snap.retreats.filter((r) => r.facilitator === x.name && r.end >= snap.today)
    return { name: x.name, retreats: rs.length, guests: rs.reduce((a, r) => a + booked(snap, r).length, 0) }
  })
  const needs = needsFor(snap)
  const lenses = (Object.keys(LENS_WORD) as Lens[]).map((l) => ({ name: LENS_WORD[l], n: needs.filter((x) => x.lens === l).length, urgent: needs.filter((x) => x.lens === l && (x.st === 'blocked' || x.st === 'risk')).length }))
  return {
    blocks: [
      { kind: 'bars', title: 'Guests per Integration Guide', max: Math.max(1, ...guides.map((x) => x.n)), rows: guides.map((x) => ({ name: x.name, v: x.n, label: plural(x.n, 'guest') })) },
      { kind: 'table', title: 'Facilitators, upcoming retreats', columns: [{ key: 'name', label: 'Facilitator' }, { key: 'retreats', label: 'Retreats', align: 'right' }, { key: 'guests', label: 'Guests booked', align: 'right' }], rows: facs.map((x) => ({ cells: { name: x.name, retreats: x.retreats, guests: x.guests } })) },
      { kind: 'bars', title: 'Open needs by team', max: Math.max(1, ...lenses.map((x) => x.n)), rows: lenses.map((x) => ({ name: x.name, v: x.n, label: `${x.n}${x.urgent ? ` · ${x.urgent} urgent` : ''}`, tone: x.urgent ? 'watch' : undefined })) },
    ],
    data: { integrationGuides: guides, facilitators: facs, needsByTeam: lenses },
  }
}

const activity: Tool = (snap, input) => {
  const g = s(input, 'guest') ? findGuest(snap, s(input, 'guest')!) : undefined
  const actor = s(input, 'actor')?.toLowerCase()
  const days = n(input, 'days', 14)
  const from = addDays(snap.today, -days)
  const evs = snap.events
    .filter((e) => e.at >= from)
    .filter((e) => !g || e.guestId === g.id)
    .filter((e) => !actor || e.actor.toLowerCase().includes(actor) || (actor.includes('nl') && e.auto))
    .filter((e) => !b(input, 'automations_only') || e.auto)
    .sort(byNewest)
  const auto = evs.filter((e) => e.auto).length
  const actors = new Map<string, number>()
  for (const e of evs) actors.set(e.actor, (actors.get(e.actor) ?? 0) + 1)
  const top = [...actors.entries()].sort((a, c) => c[1] - a[1]).slice(0, 6)
  if (!evs.length) return { blocks: [{ kind: 'note', text: `Nothing was logged${g ? ` for ${g.name}` : ''} in the last ${plural(days, 'day')}.` }], data: { count: 0 } }
  return {
    blocks: [
      { kind: 'stats', items: [{ label: `Logged, last ${days} days`, value: String(evs.length) }, { label: 'By NL-OS on its own', value: String(auto), sub: `${Math.round((auto / evs.length) * 100)}%` }, { label: 'By people', value: String(evs.length - auto) }] },
      ...(top.length > 1 ? [{ kind: 'bars' as const, title: 'Who acted', max: top[0][1], rows: top.map(([name, v]) => ({ name, v, label: String(v) })) }] : []),
      activityBlock(snap, g ? `${g.name}’s activity` : 'Activity, newest first', evs.slice(0, 14)),
    ],
    data: { count: evs.length, automations: auto, byActor: Object.fromEntries(top), recent: evs.slice(0, 14).map((e) => `${e.at} ${e.actor}${e.guestId ? ` (${snap.guests.find((x) => x.id === e.guestId)?.name})` : ''}: ${e.text}`) },
  }
}

const automationImpact: Tool = (snap) => {
  const auto = snap.events.filter((e) => e.auto)
  const replaced = new Set(auto.flatMap((e) => e.replaces ?? []).filter((id) => STEPS[id]))
  const manualSteps = STEP_IDS.filter((id) => STEPS[id].type === 'Manual' || STEPS[id].type === 'Staff')
  const bySection = new Map<string, number>()
  for (const id of replaced) bySection.set(STEPS[id].section, (bySection.get(STEPS[id].section) ?? 0) + 1)
  const stepCount = new Map<string, number>()
  for (const e of auto) for (const id of e.replaces ?? []) if (STEPS[id]) stepCount.set(id, (stepCount.get(id) ?? 0) + 1)
  const topSteps = [...stepCount.entries()].sort((a, c) => c[1] - a[1]).slice(0, 8)
  return {
    blocks: [
      { kind: 'stats', items: [{ label: 'Automations run', value: String(auto.length), sub: `of ${snap.events.length} logged actions` }, { label: 'Flowchart steps taken over', value: String(replaced.size), sub: `of ${STEP_IDS.length} steps today` }, { label: 'Manual or staff steps today', value: String(manualSteps.length) }] },
      { kind: 'ring', title: 'Logged work done by NL-OS', value: snap.events.length ? auto.length / snap.events.length : 0, big: `${snap.events.length ? Math.round((auto.length / snap.events.length) * 100) : 0}%`, unit: 'Automated', sub: `${auto.length} of ${snap.events.length} actions` },
      ...(bySection.size ? [{ kind: 'bars' as const, title: 'Steps taken over, by flowchart section', max: Math.max(...bySection.values()), rows: [...bySection.entries()].sort((a, c) => c[1] - a[1]).map(([name, v]) => ({ name, v, label: plural(v, 'step') })) }] : []),
      ...(topSteps.length ? [{ kind: 'table' as const, title: 'Most-run replacements', columns: [{ key: 'step', label: 'Step today' }, { key: 'type', label: 'Done today by' }, { key: 'runs', label: 'Runs', align: 'right' as const }], rows: topSteps.map(([id, c]) => ({ cells: { step: `${id} · ${STEPS[id].title}`, type: STEPS[id].type, runs: c } })) }] : []),
    ],
    data: { automations: auto.length, actions: snap.events.length, stepsReplaced: replaced.size, totalSteps: STEP_IDS.length, manualOrStaffSteps: manualSteps.length, bySection: Object.fromEntries(bySection), topSteps: topSteps.map(([id, c]) => ({ step: STEPS[id].title, runs: c })) },
  }
}

const upcoming: Tool = (snap, input) => {
  const days = n(input, 'days', 21)
  const end = addDays(snap.today, days)
  const inWin = (d?: string) => !!d && d >= snap.today && d <= end
  type Item = { date: string; what: string; who: string; tone: 'lit' | 'watch' | 'pending' | ''; guestId?: string; retreatId?: string }
  const items: Item[] = []
  for (const r of snap.retreats) if (inWin(r.start)) items.push({ date: r.start, what: `${retreatName(r)} starts`, who: `${booked(snap, r).length} of ${r.rooms} rooms · ${r.facilitator}`, tone: 'lit', retreatId: r.id })
  for (const g of snap.guests.filter(isActive)) {
    for (const f of FORMS) if (g.forms[f.id] && !g.forms[f.id]!.done && inWin(g.forms[f.id]!.due)) items.push({ date: g.forms[f.id]!.due, what: `${f.word} due`, who: g.name, tone: 'pending', guestId: g.id })
    if (g.hold && inWin(g.hold.expires)) items.push({ date: g.hold.expires, what: 'Room hold ends', who: g.name, tone: 'watch', guestId: g.id })
    if (g.care.checkInDue && !g.care.checkIn && inWin(g.care.checkInDue)) items.push({ date: g.care.checkInDue, what: '48-hour check-in', who: `${g.name} · ${g.integrator ?? 'unassigned'}`, tone: 'pending', guestId: g.id })
    if (g.retention && !g.retention.outcome && inWin(g.retention.callDue)) items.push({ date: g.retention.callDue, what: 'Retention call', who: g.name, tone: 'pending', guestId: g.id })
  }
  items.sort((a, c) => a.date.localeCompare(c.date))
  if (!items.length) return { blocks: [{ kind: 'note', text: `Nothing is dated in the next ${plural(days, 'day')}.` }], data: { count: 0 } }
  // one mark a day on the timeline, so labels on the same date never overlap
  const byDay = new Map<string, Item[]>()
  for (const x of items.filter((y) => y.tone !== 'pending')) byDay.set(x.date, [...(byDay.get(x.date) ?? []), x])
  const marks = [...byDay.entries()].slice(0, 8).map(([date, xs]) => ({ date, what: xs.map((x) => (x.retreatId ? `${x.retreatId} starts` : x.what)).join(' · '), tone: xs.some((x) => x.tone === 'watch') ? ('watch' as const) : ('lit' as const) }))
  return {
    blocks: [
      ...(marks.length ? [{ kind: 'timeline' as const, title: `Next ${days} days`, start: 0, end: days, today: 0, todayLabel: `Today · ${fmt(snap.today)}`, items: marks.map((x) => ({ at: daysBetween(snap.today, x.date), title: x.what, sub: fmt(x.date), tone: x.tone })) }] : []),
      { kind: 'table', title: 'Everything dated', columns: [{ key: 'date', label: 'Date' }, { key: 'what', label: 'What' }, { key: 'who', label: 'Who' }], rows: items.map((x) => ({ guestId: x.guestId, retreatId: x.retreatId, st: x.tone === 'watch' ? ('risk' as Status) : undefined, cells: { date: fmt(x.date, { weekday: 'short', month: 'short', day: 'numeric' }), what: x.what, who: x.who } })) },
    ],
    data: { days, items: items.map((x) => ({ date: x.date, when: fmt(x.date), what: x.what, who: x.who })) },
  }
}

const blueprint: Tool = (_snap, input) => {
  const topic = s(input, 'topic') ?? 'insights'
  const q = s(input, 'query') ? norm(s(input, 'query')!) : undefined
  const hit = (t: string) => !q || q.split(' ').every((w) => norm(t).includes(w))
  if (topic === 'flow') {
    const ids = STEP_IDS.filter((id) => hit(`${STEPS[id].title} ${STEPS[id].detail} ${STEPS[id].section}`))
    const types = ['Manual', 'Staff', 'Auto', 'Decision', 'Trigger', 'Pipeline'].map((t) => ({ t, c: STEP_IDS.filter((id) => STEPS[id].type === t).length })).filter((x) => x.c)
    return {
      blocks: [
        { kind: 'fan', title: 'Today’s flowchart, by who does each step', total: String(STEP_IDS.length), totalLabel: 'Steps today', parts: types.map((x) => ({ name: x.t, value: String(x.c), share: x.c / STEP_IDS.length })) },
        { kind: 'bars', title: 'Tagged SOP steps by chapter', max: 20, rows: CHAPTERS.map((c) => ({ name: `${c.code} ${c.name}`, v: c.steps, label: String(c.steps) })) },
        ...(q ? [{ kind: 'table' as const, title: `Steps matching “${s(input, 'query')}”`, columns: [{ key: 'id', label: 'Step' }, { key: 'title', label: 'What happens' }, { key: 'type', label: 'Type' }, { key: 'section', label: 'Section' }], rows: ids.slice(0, 20).map((id) => ({ cells: { id, title: STEPS[id].title, type: STEPS[id].type, section: STEPS[id].section } })) }] : []),
      ],
      data: { steps: STEP_IDS.length, byType: Object.fromEntries(types.map((x) => [x.t, x.c])), matches: ids.slice(0, 20).map((id) => ({ id, title: STEPS[id].title, type: STEPS[id].type, section: STEPS[id].section, detail: STEPS[id].detail })) },
    }
  }
  if (topic === 'systems') {
    return {
      blocks: [
        { kind: 'stats', items: [{ label: 'Systems in use today', value: String(STACK.length) }, { label: 'Vendors NL-OS is scoped to replace', value: String(CVOS.vendors.filter((v) => v.onStack).length) }] },
        { kind: 'table', title: 'The stack and what replaces it', columns: [{ key: 'name', label: 'System' }, { key: 'role', label: 'Used for' }, { key: 'module', label: 'NL-OS module' }], rows: CVOS.vendors.map((v) => ({ cells: { name: v.name, role: v.role, module: v.module } })), note: CVOS.summary },
      ],
      data: { stack: STACK, replaces: CVOS.vendors.map((v) => ({ name: v.name, role: v.role, module: v.module })), summary: CVOS.summary },
    }
  }
  if (topic === 'sessions') {
    const tone = { held: 'done', next: 'lit', ahead: '', tbd: '' } as const
    return {
      blocks: [
        { kind: 'chain', title: 'Discovery sessions', steps: SESSIONS.map((x) => ({ title: x.short, sub: x.state === 'held' ? 'Held' : x.state === 'next' ? 'Next' : x.state === 'tbd' ? 'To schedule' : 'Ahead', tone: tone[x.state] })) },
        { kind: 'table', title: 'What each session settles', columns: [{ key: 'n', label: '#' }, { key: 'name', label: 'Session' }, { key: 'goal', label: 'Goal' }, { key: 'q', label: 'Questions', align: 'right' }], rows: SESSIONS.map((x) => ({ cells: { n: x.n, name: x.name, goal: x.goal ?? '—', q: x.questions.length } })) },
      ],
      data: { sessions: SESSIONS.map((x) => ({ n: x.n, name: x.name, state: x.state, goal: x.goal, questions: x.questions.map((y) => y.q) })) },
    }
  }
  const ins = INSIGHTS.filter((x) => hit(`${x.id} ${x.kind} ${x.title} ${x.body.join(' ')} ${x.answer}`))
  return {
    blocks: ins.length ? [{ kind: 'insights', title: q ? `Insights matching “${s(input, 'query')}”` : 'The 10 intake insights', items: ins.map((x) => ({ id: x.id, tag: x.kind, title: x.title, body: x.body.join(' '), answer: x.answer })) }] : [{ kind: 'note', text: `No insight mentions “${s(input, 'query')}”.` }],
    data: { insights: ins.map((x) => ({ id: x.id, kind: x.kind, title: x.title, body: x.body.join(' '), answer: x.answer })) },
  }
}

export const TOOLS: Record<string, Tool> = {
  overview,
  pipeline,
  find_guests: findGuests,
  guest_profile: guestProfile,
  needs: needsTool,
  retreats,
  retreat_detail: retreatDetail,
  revenue,
  channels,
  medical_reviews: medicalReviews,
  readiness,
  care,
  staff_workload: staffWorkload,
  activity,
  automation_impact: automationImpact,
  upcoming,
  blueprint,
}

/** Runs one tool. An unknown name or a failure comes back as a note card and an error the model can read. */
export function runTool(snap: Snapshot, name: string, input: unknown): ToolOutput & { error?: string } {
  const tool = TOOLS[name]
  if (!tool) return { blocks: [], data: null, error: `Unknown tool ${name}` }
  try {
    return tool(snap, input && typeof input === 'object' ? (input as Input) : {})
  } catch (e) {
    return { blocks: [{ kind: 'note', title: 'That lookup failed', text: 'This part of the answer could not be read. Ask again, or ask about something more specific.' }], data: null, error: e instanceof Error ? e.message : 'Tool failed' }
  }
}
