// The built-in matcher: answers without a model when /api/ask is not reachable (local development, no API key, or no
// sign-in). It reads the question for names, retreat ids and topic words, picks the same tools Claude would call, and
// writes one plain sentence from what each tool found. It covers the questions the tools can answer; anything else
// gets the overview and a note saying what it can answer.
import type { StageId } from '../model'
import { findRetreat, money, type Snapshot } from './tools'

export type Call = { name: string; input: Record<string, unknown> }

const has = (q: string, ...words: (string | RegExp)[]) => words.some((w) => (typeof w === 'string' ? q.includes(w) : w.test(q)))

/** A guest named in the question: a full name, or a first or last name that only one guest has. */
function guestIn(snap: Snapshot, q: string) {
  const full = snap.guests.find((g) => q.includes(g.name.toLowerCase()))
  if (full) return full
  const words = q.split(/[^a-z']+/).filter((w) => w.length > 2)
  const hits = snap.guests.filter((g) => g.name.toLowerCase().split(' ').some((part) => words.includes(part.replace(/[^a-z']/g, ''))))
  return hits.length === 1 ? hits[0] : undefined
}

function retreatIn(snap: Snapshot, q: string) {
  const m = q.match(/\b([ab])\s*#?\s*(\d{1,3})\b/) ?? q.match(/\b(europe|highlands?)\s*#?\s*(\d{1,3})\b/) ?? q.match(/\bretreat\s+([ab])\b.*?#?\s*(\d{1,3})/)
  return m ? findRetreat(snap, `${m[1]} ${m[2]}`) : undefined
}

const STAGE_WORDS: [RegExp, StageId][] = [
  [/\binquir/, 'inquiry'], [/\bapplication|\bapplied/, 'application'], [/medical review|in review|\breview/, 'review'],
  [/agreement|payment stage/, 'agreement'], [/\bpreparing|\bprep\b/, 'preparing'], [/on retreat/, 'retreat'],
  [/integration/, 'integration'], [/retention/, 'retention'], [/\blost\b/, 'lost'], [/not approved|declined|rejected/, 'not-approved'], [/inactive/, 'inactive'],
]

export function plan(snap: Snapshot, question: string): Call[] {
  const q = ` ${question.toLowerCase().replace(/[’']/g, "'")} `
  const calls: Call[] = []
  const add = (name: string, input: Record<string, unknown> = {}) => {
    if (!calls.some((c) => c.name === name)) calls.push({ name, input })
  }
  const g = guestIn(snap, q)
  const r = retreatIn(snap, q)
  const who = has(q, /\bwho\b/, 'which guests', 'list ', 'show me', 'find ', 'guests in', 'guests on', 'guests with', 'guests who', 'anyone')

  if (g) {
    add('guest_profile', { guest: g.name })
    if (has(q, 'activity', 'history', 'log', 'happened', 'timeline')) add('activity', { guest: g.name, days: 120 })
  }
  if (r) {
    add('retreat_detail', { retreat: r.id })
    if (has(q, 'form', 'ready', 'readiness', 'consent', 'checklist')) add('readiness', { retreat: r.id })
  }
  if (g || r) return calls

  const stages = STAGE_WORDS.filter(([re]) => re.test(q)).map(([, id]) => id)
  if (who && (stages.length || has(q, 'returning', 'unpaid', 'overdue', 'owe', 'referr', 'partner', 'package', 'scholarship'))) {
    add('find_guests', {
      stages: stages.length ? stages : undefined,
      returning: has(q, 'returning') ? true : has(q, 'first-time', 'first time', 'new guest') ? false : undefined,
      unpaid: has(q, 'unpaid', "haven't paid", 'not paid', 'owe us', 'owes us') || undefined,
      overdue_forms: has(q, 'overdue form', 'forms overdue', 'owe form', 'owes form', 'late form', 'missing form') || undefined,
      channel: has(q, 'referr', 'partner') ? 'Referral partner' : has(q, 'direct') ? 'Direct inquiry' : has(q, 'salesperson') ? 'Salesperson' : has(q, ' elan') ? 'Elan' : undefined,
      program: has(q, 'package') ? 'package-4' : has(q, 'scholarship') ? 'scholarship' : has(q, 'one-off', 'one off') ? 'one-off' : undefined,
    })
  }
  if (has(q, 'revenue', 'money', 'paid', 'invoice', 'outstanding', 'cash', 'booked value', 'sales value', '$', 'income', 'earn', 'price')) {
    add('revenue', { group_by: has(q, 'channel', 'source') ? 'channel' : has(q, 'retreat') ? 'retreat' : has(q, 'status', 'unpaid') ? 'status' : 'program' })
  }
  if (has(q, 'medical', 'review', 'approval', 'approve', 'clinical', 'doctor')) add('medical_reviews')
  if (has(q, 'form', 'readiness', 'ready', 'consent', 'checklist', 'travel detail', 'prep guide')) add('readiness')
  if (has(q, 'referr', 'channel', 'source', 'partner', 'come from', 'lead')) add('channels')
  if (has(q, 'occupan', 'capacity', 'room', 'retreats', 'schedule', 'calendar', 'full')) {
    add('retreats', { window: has(q, 'this week') ? 'this_week' : has(q, 'this month', 'next month') ? 'this_month' : has(q, 'past', 'last ', 'previous') ? 'past' : 'upcoming' })
  }
  if (has(q, 'need', 'urgent', 'attention', 'blocked', 'to do', 'todo', 'priorit', 'at risk', 'overdue', 'stuck', 'exception', 'problem')) {
    add('needs', { lens: has(q, 'sales') ? 'sales' : has(q, 'operation', ' ops') ? 'operations' : has(q, 'clinical', 'medical team') ? 'clinical' : has(q, 'care team') ? 'care' : undefined, urgent_only: has(q, 'urgent', 'at risk', 'blocked') || undefined })
  }
  if (has(q, 'care', 'integration', 'check-in', 'check in', 'aftercare', 'living well', 'retention call', 'session note')) add('care')
  if (has(q, 'staff', 'workload', 'busy', 'busiest', 'team', 'integrator', 'facilitator', 'guide', 'who is doing')) add('staff_workload')
  if (has(q, 'automat', 'nl-os do', 'took over', 'take over', 'saved', 'manual work')) add('automation_impact')
  if (has(q, 'activity', ' log', 'happened', 'recent', 'yesterday', 'last week', 'what did', 'who did')) add('activity', { automations_only: has(q, 'automat') || undefined, days: has(q, 'yesterday') ? 2 : has(q, 'month') ? 31 : 14 })
  if (has(q, 'upcoming', 'coming up', 'next week', 'next few', 'due ', 'deadline', 'this week', 'agenda', 'what\'s next', 'next 30')) add('upcoming', { days: has(q, 'two weeks', '2 weeks', 'fortnight') ? 14 : has(q, 'week') ? 7 : has(q, 'month', '30') ? 30 : 21 })
  if (has(q, 'funnel', 'pipeline', 'conversion', 'convert', 'stage', 'journey', 'drop off', 'drop-off')) add('pipeline', { include_exits: has(q, 'lost', 'drop', 'left', 'exit') || undefined })
  if (has(q, 'insight', 'why ', 'pain point', 'problem today', 'discovery finding')) add('blueprint', { topic: 'insights' })
  if (has(q, 'flowchart', 'flow chart', 'steps', 'process', 'sop', 'manual step')) add('blueprint', { topic: 'flow' })
  if (has(q, 'system', 'stack', 'vendor', 'tool we use', 'software')) add('blueprint', { topic: 'systems' })
  if (has(q, 'discovery', 'session')) add('blueprint', { topic: 'sessions' })
  if (who && !calls.length) add('find_guests', {})
  if (has(q, 'overview', 'summary', 'summar', 'how are we', 'how is', 'status', 'today', 'everything', 'big picture', 'health') || !calls.length) add('overview')
  return calls.slice(0, 4)
}

type Data = Record<string, any> // eslint-disable-line @typescript-eslint/no-explicit-any

/** One plain sentence for what a tool found, from its data summary. */
export function sentence(name: string, d: Data | null): string {
  if (!d) return ''
  const list = (xs: string[], max = 3) => (xs.length <= max ? xs.join(', ') : `${xs.slice(0, max).join(', ')} and ${xs.length - max} more`)
  switch (name) {
    case 'overview':
      return `${d.onJourney} guests are on the journey and ${d.needs} things need a person, ${d.urgent} of them overdue or at risk. Booked value is ${money(d.bookedValue)}, with ${money(d.outstanding)} outstanding across ${d.unpaidInvoices} invoices.`
    case 'pipeline': {
      const weakest = [...d.stepThrough].sort((a: Data, b: Data) => a.v - b.v)[0]
      return `The largest group sits in ${Object.entries(d.atStage as Record<string, number>).sort((a, b) => b[1] - a[1])[0][0].toLowerCase()}. The weakest step is ${weakest.name.toLowerCase()}, at ${weakest.v}%.`
    }
    case 'find_guests':
      return d.count ? `${d.count} guest${d.count === 1 ? '' : 's'} match: ${list(d.guests.map((g: Data) => g.name))}.` : 'No guest matches.'
    case 'guest_profile':
      return d.found ? `${d.name} is at the ${String(d.stage).toLowerCase()} stage, ${d['In this stage']}.${d.needs.length ? ` Waiting: ${d.needs.join('; ')}.` : ' Nothing about them waits on a person.'}` : 'No guest by that name.'
    case 'needs':
      return d.count ? `${d.count} item${d.count === 1 ? '' : 's'} wait on a person. The most urgent: ${d.items[0].title}.` : 'Nothing waits on a person.'
    case 'retreats': {
      const rs = (d.retreats ?? []) as Data[]
      const thin = rs.filter((x) => x.booked / x.rooms < 0.5)
      return rs.length ? `${rs.length} retreat${rs.length === 1 ? '' : 's'}: ${rs.reduce((a, x) => a + x.booked, 0)} of ${rs.reduce((a, x) => a + x.rooms, 0)} rooms booked.${thin.length ? ` Under half full: ${list(thin.map((x) => x.id))}.` : ''}` : 'No retreats in that window.'
    }
    case 'retreat_detail':
      return d.found ? `${d.name} has ${d.booked.length} of ${d.rooms} rooms booked and ${d.held.length} held. ${d.booked.filter((g: Data) => g.overdueForms.length).length} booked guests owe forms.` : 'No retreat by that name.'
    case 'revenue':
      return `Booked value is ${money(d.bookedValue)}; ${money(d.paid)} is paid and ${money(d.outstanding)} is outstanding${d.unpaid.length ? `, the oldest invoice ${d.unpaid[0].daysOld} days old (${d.unpaid[0].guest})` : ''}.`
    case 'channels': {
      const top = [...d.byChannel].sort((a: Data, b: Data) => b.total - a.total)[0]
      return top ? `Most guests come through ${String(top.c).toLowerCase()}: ${top.total}, of whom ${top.booked} booked.` : ''
    }
    case 'medical_reviews':
      return `${d.queue.length} application${d.queue.length === 1 ? '' : 's'} wait on the Medical Team${d.queue.some((x: Data) => x.daysWaiting > d.targetDays) ? `, and ${list(d.queue.filter((x: Data) => x.daysWaiting > d.targetDays).map((x: Data) => `${x.name} (${x.daysWaiting} days)`))} ${d.queue.filter((x: Data) => x.daysWaiting > d.targetDays).length === 1 ? 'is' : 'are'} past the ${d.targetDays}-day target` : ''}.`
    case 'readiness':
      return d.overdue.length ? `${d.overdue.length} guest${d.overdue.length === 1 ? '' : 's'} owe forms: ${list(d.overdue.map((x: Data) => `${x.name} (${x.owes.join(', ')})`), 2)}.` : 'Every readiness checklist is on time.'
    case 'care':
      return `${d.integration.length} guests are in integration. ${d.checkInsDue.length} check-in${d.checkInsDue.length === 1 ? ' is' : 's are'} due and ${d.notesLate.length} set${d.notesLate.length === 1 ? '' : 's'} of session notes ${d.notesLate.length === 1 ? 'is' : 'are'} late.`
    case 'staff_workload': {
      const top = [...d.integrationGuides].sort((a: Data, b: Data) => b.n - a.n)[0]
      return top ? `${top.name} carries the most guests among the Integration Guides (${top.n}).` : ''
    }
    case 'activity':
      return d.count ? `${d.count} actions were logged, ${d.automations} of them by NL-OS on its own.` : 'Nothing was logged in that window.'
    case 'automation_impact':
      return `NL-OS ran ${d.automations} of ${d.actions} logged actions and has taken over ${d.stepsReplaced} of the ${d.totalSteps} steps in today's flowchart.`
    case 'upcoming':
      return d.count === 0 ? 'Nothing is dated in that window.' : `${d.items.length} dated items in the next ${d.days} days; the first is ${d.items[0].what.toLowerCase()} (${d.items[0].who}) on ${d.items[0].when}.`
    case 'blueprint':
      return d.insights ? `${d.insights.length} insight${d.insights.length === 1 ? '' : 's'} from the discovery documents.` : d.steps ? `Today's flowchart has ${d.steps} steps.` : d.sessions ? `Discovery runs in ${d.sessions.length} sessions.` : d.stack ? `The business runs on ${d.stack.length} systems today.` : ''
    default:
      return ''
  }
}
