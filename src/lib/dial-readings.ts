// What the bird's-eye dial reads, worked out from the items. Every ring reports something real; a builder points the
// rings at their own data by changing this file alone (an analytics source, a KPI, orders, bookings).
//   01 progress   done items out of the open work (active and done)
//   02 mix        every item by state
//   03 activity   items changed in the last 7 days, out of all items
//   04 rhythm     the last 14 days, one cell a day, lit when an item was added or changed
//   the needle    days since the last change, toward 14 (when the app reads as gone quiet)
import type { Item } from '@/lib/api/items'
import { ITEM_STATES, countByState } from '@/lib/items'
import type { DialReading } from '@/components/system/dial'

const DAY = 86_400_000
export const WINDOW_DAYS = 14
const QUIET_AFTER = 7

/** D1 writes "YYYY-MM-DD HH:MM:SS" in UTC; ISO strings pass through. */
export const timeOf = (iso: string) => Date.parse(iso.includes('T') ? iso : `${iso.replace(' ', 'T')}Z`)

export interface DialFacts {
  reading: DialReading
  total: number
  open: number
  done: number
  changedThisWeek: number
  activeDays: number
  /** whole days since the last change, or null with no items */
  sinceLast: number | null
  latest: Item | null
  counts: ReturnType<typeof countByState>
}

export function readDial(items: Item[], name: string, now = Date.now()): DialFacts {
  const counts = countByState(items)
  const n = (id: string) => counts.find((c) => c.id === id)?.n ?? 0
  const done = n('done'), open = n('active') + done
  const changed = items.filter((i) => now - timeOf(i.updated_at) < QUIET_AFTER * DAY).length
  const today = Math.floor(now / DAY)
  const days = Array.from({ length: WINDOW_DAYS }, (_, k) => {
    const day = today - (WINDOW_DAYS - 1 - k)
    return items.some((i) => Math.floor(timeOf(i.created_at) / DAY) === day || Math.floor(timeOf(i.updated_at) / DAY) === day)
  })
  const latest = [...items].sort((a, b) => timeOf(b.updated_at) - timeOf(a.updated_at))[0] ?? null
  const sinceLast = latest ? Math.max(0, Math.floor((now - timeOf(latest.updated_at)) / DAY)) : null
  const pct = open ? done / open : 0
  const status = !items.length
    ? { st: 'quiet' as const, word: 'No data yet' }
    : sinceLast !== null && sinceLast >= QUIET_AFTER
      ? { st: 'risk' as const, word: 'Going quiet' }
      : { st: 'ok' as const, word: 'Active' }
  const activeDays = days.filter(Boolean).length
  return {
    total: items.length,
    open,
    done,
    changedThisWeek: changed,
    activeDays,
    sinceLast,
    latest,
    counts,
    reading: {
      pct,
      big: `${Math.round(pct * 100)}%`,
      unit: 'Done',
      sub: open ? `${done} of ${open} items` : 'No open items',
      mix: ITEM_STATES.map((s) => ({ tone: s.tone, n: n(s.id), label: s.word })),
      flow: { n: changed, of: items.length, label: items.length ? `${changed} of ${items.length} changed this week` : 'No changes yet' },
      days,
      daysLabel: `Active ${activeDays} of ${WINDOW_DAYS} days`,
      needle: sinceLast !== null ? { share: Math.min(1, sinceLast / WINDOW_DAYS), label: `Last change ${sinceLast === 0 ? 'today' : `${sinceLast} ${sinceLast === 1 ? 'day' : 'days'} ago`}` } : undefined,
      top: name,
      ...status,
    },
  }
}
