// Needs you: the exceptions NL-OS finds in the live state, each with the person who owns it and the action that
// clears it. These are the moments the documents say fall through today: a review with no clock (I04), a hold never
// released (I05), reminders that simply stop (I06), forms with no checklist (I09), late facilitator notes and missing
// integrators (the wish list).
import { useMemo } from 'react'
import { daysBetween, fmt, FORMS, midSentence, retreatName, STAGE, type Guest, type Retreat } from './model'
import { MAX_REMINDERS, REVIEW_TARGET_DAYS, useOs } from './store'
import type { Status } from '@/components/system/status'

export type Lens = 'operations' | 'sales' | 'clinical' | 'care'
export const LENS_WORD: Record<Lens, string> = { operations: 'Operations', sales: 'Sales', clinical: 'Medical Team', care: 'Care team' }

export interface Need {
  key: string
  lens: Lens
  st: Status
  word: string
  title: string
  why: string
  guestId: string
  /** the insight or wish this exception comes from */
  source: string
  /** sorts the list: overdue first */
  urgency: number
}

export function findNeeds(today: string, guests: Guest[], retreats: Retreat[]): Need[] {
  const out: Need[] = []
  const rt = (id?: string) => retreats.find((r) => r.id === id)
  for (const g of guests) {
    const days = (d?: string) => (d ? daysBetween(d, today) : 0)
    if (g.stage === 'inquiry')
      out.push({ key: `${g.id}-qualify`, lens: 'sales', st: 'pending', word: 'Needs you', title: `Qualify ${g.name}`, why: `${g.channel}${g.referrer ? ` via ${g.referrer}` : ''}, waiting ${days(g.since)} day${days(g.since) === 1 ? '' : 's'}. Qualifying sends the application and holds a room.`, guestId: g.id, source: 'I01', urgency: days(g.since) })
    if (g.stage === 'application' && g.application.reminders >= MAX_REMINDERS)
      out.push({ key: `${g.id}-stalled`, lens: 'sales', st: 'risk', word: 'Stalled', title: `${g.name}’s application has stalled`, why: `${MAX_REMINDERS} reminders since ${fmt(g.application.sent!)}, and no reply. Today nothing happens next; decide whether to call, extend or mark the lead lost.`, guestId: g.id, source: 'I06', urgency: 20 })
    if (g.hold && daysBetween(today, g.hold.expires) <= 3)
      out.push({ key: `${g.id}-hold`, lens: 'operations', st: 'risk', word: 'Hold lapsing', title: `Room hold for ${g.name} ends ${fmt(g.hold.expires)}`, why: `On ${rt(g.hold.retreatId) ? retreatName(rt(g.hold.retreatId)!) : g.hold.retreatId}, while the guest is in ${STAGE[g.stage].word.toLowerCase()}. NL-OS releases it on that date unless someone extends it.`, guestId: g.id, source: 'I05', urgency: 10 - daysBetween(today, g.hold.expires) })
    if (g.stage === 'review' && g.medical.status === 'in-review' && days(g.medical.submitted) > REVIEW_TARGET_DAYS)
      out.push({ key: `${g.id}-review`, lens: 'clinical', st: 'blocked', word: 'Past target', title: `${g.name}’s medical review has waited ${days(g.medical.submitted)} days`, why: `The target is ${REVIEW_TARGET_DAYS} days. Everything after approval waits on this decision.`, guestId: g.id, source: 'I04', urgency: 30 + days(g.medical.submitted) })
    else if (g.stage === 'review' && g.medical.status === 'in-review')
      out.push({ key: `${g.id}-review`, lens: 'clinical', st: 'pending', word: 'To review', title: `Review ${g.name}’s application`, why: `Submitted ${fmt(g.medical.submitted!)}; inside the ${REVIEW_TARGET_DAYS}-day target.`, guestId: g.id, source: 'I04', urgency: 5 })
    if (g.stage === 'agreement' && g.invoice && !g.invoice.paid && days(g.invoice.sent) >= 7)
      out.push({ key: `${g.id}-unpaid`, lens: 'operations', st: 'risk', word: 'Unpaid', title: `Invoice ${g.invoice.number} unpaid for ${days(g.invoice.sent)} days`, why: `${g.name}${g.agreement.signed ? ' signed the agreement' : ' has not signed the agreement either'}. ${g.invoice.reminders} reminder${g.invoice.reminders === 1 ? '' : 's'} sent.`, guestId: g.id, source: 'I06', urgency: 12 + days(g.invoice.sent) })
    if (['preparing', 'agreement'].includes(g.stage) && g.medical.status === 'approved' && !g.integrator)
      out.push({ key: `${g.id}-integrator`, lens: 'operations', st: 'pending', word: 'Unassigned', title: `Assign an integrator to ${g.name}`, why: 'Rosa was asked on approval. The intro call can’t be scheduled until someone is assigned.', guestId: g.id, source: 'C4', urgency: 8 })
    if (g.stage === 'preparing') {
      const late = FORMS.filter((f) => g.forms[f.id] && !g.forms[f.id]!.done && g.forms[f.id]!.due < today)
      const r = rt(g.retreatId)
      if (late.length)
        out.push({ key: `${g.id}-forms`, lens: 'operations', st: 'blocked', word: 'Overdue', title: `${g.name} owes ${late.map((f) => midSentence(f.word)).join(' and ')}`, why: `Due ${fmt(g.forms[late[0].id]!.due)}${r ? `; ${retreatName(r)} starts ${fmt(r.start)}` : ''}. Today nothing defines what happens if a form isn’t back.`, guestId: g.id, source: 'I09', urgency: 25 + (r ? 10 - daysBetween(today, r.start) : 0) })
    }
    const r = rt(g.retreatId)
    if (g.stage === 'retreat' && r && r.end < today && !g.session?.notes)
      out.push({ key: `${g.id}-notes`, lens: 'care', st: 'blocked', word: 'Notes late', title: `Session notes for ${g.name} are late`, why: `${r.facilitator}’s access window closes 3 days after the retreat. Admin is alerted when notes are late.`, guestId: g.id, source: 'Wish list', urgency: 18 })
    if (g.stage === 'retreat' && r && r.end <= today && g.session?.notes)
      out.push({ key: `${g.id}-complete`, lens: 'operations', st: 'pending', word: 'Ready', title: `Mark ${g.name}’s session complete`, why: 'Notes are in. One press sends the integration audio, sets Past Client and starts integration care.', guestId: g.id, source: 'Wish list', urgency: 9 })
    if (g.stage === 'integration' && g.care.checkInDue && !g.care.checkIn && g.care.checkInDue <= today)
      out.push({ key: `${g.id}-checkin`, lens: 'care', st: g.care.checkInDue < today ? 'blocked' : 'pending', word: g.care.checkInDue < today ? 'Overdue' : 'Due today', title: `48-hour check-in with ${g.name}`, why: `${g.integrator ?? 'The Integration Guide'} runs the post-visit check-in; the session ended ${fmt(g.session?.completed ?? g.since)}.`, guestId: g.id, source: 'G1', urgency: 15 })
    if (g.stage === 'integration' && g.care.finalized && g.program && g.sessionsUsed < (g.program === 'package-4' ? 4 : 1))
      out.push({ key: `${g.id}-book`, lens: 'operations', st: 'pending', word: 'Book next', title: `Book ${g.name}’s next package session`, why: `${g.sessionsUsed} of 4 sessions used. Integration is finalized.`, guestId: g.id, source: 'K3', urgency: 7 })
    if (g.stage === 'retention' && g.retention && !g.retention.outcome && g.retention.callDue <= today)
      out.push({ key: `${g.id}-retention`, lens: 'sales', st: g.retention.callDue < today ? 'risk' : 'pending', word: g.retention.callDue < today ? 'Overdue' : 'Due today', title: `Retention call with ${g.name}`, why: `Due ${fmt(g.retention.callDue)}, seven days after the last session.`, guestId: g.id, source: 'K5', urgency: 14 })
  }
  return out.sort((a, b) => b.urgency - a.urgency)
}

export function useNeeds(lens?: Lens | Lens[]) {
  const today = useOs((s) => s.today)
  const guests = useOs((s) => s.guests)
  const retreats = useOs((s) => s.retreats)
  return useMemo(() => {
    const all = findNeeds(today, guests, retreats)
    const want = lens ? (Array.isArray(lens) ? lens : [lens]) : null
    return want ? all.filter((n) => want.includes(n.lens)) : all
  }, [today, guests, retreats, lens])
}
