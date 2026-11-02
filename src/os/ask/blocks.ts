// The response cards Ask can show. Every card is plain data, computed when the question is answered and kept with the
// conversation, so an earlier answer still reads the same after the day advances. Rows that stand for a guest or a
// retreat carry its id, so the card can open the live record. cards.tsx draws each kind with the design system's parts.
import type { Status } from '@/components/system/status'
import type { Tone } from '@/components/system/charts/track'

export type Stat = { label: string; value: string; sub?: string; st?: Status }
export type Column = { key: string; label: string; align?: 'right' }
export type Row = { cells: Record<string, string | number>; guestId?: string; retreatId?: string; st?: Status }
export type GuestLine = { id: string; name: string; sub: string; stage: string; st: Status; returning?: boolean }

export type Block =
  | { kind: 'stats'; title?: string; items: Stat[] }
  | { kind: 'stages'; title: string; code: string; meta?: string; stages: { name: string; n: number; tone?: Tone }[] }
  | { kind: 'bars'; title: string; rows: { name: string; v: number; label: string; tone?: 'watch' | 'blocked' | 'done'; guestId?: string; retreatId?: string }[]; max: number; mark?: number; markLabel?: string }
  | { kind: 'fan'; title: string; total: string; totalLabel: string; sub?: string; parts: { name: string; value: string; note?: string; share: number; st?: Status }[] }
  | { kind: 'ring'; title: string; value: number; plan?: number; big: string; unit: string; sub?: string; st?: Status; note?: string }
  | { kind: 'table'; title: string; columns: Column[]; rows: Row[]; note?: string }
  | { kind: 'guests'; title: string; rows: GuestLine[]; more?: number }
  | { kind: 'needs'; title: string; items: { key: string; st: Status; word: string; title: string; why: string; guestId: string; owner: string }[] }
  | { kind: 'guest'; id: string; name: string; headline: string; stage: string; st: Status; facts: { label: string; value: string }[]; journey: { title: string; sub?: string; tone?: Tone }[]; forms: { word: string; state: 'done' | 'late' | 'open'; due: string }[] }
  | { kind: 'retreats'; title: string; items: { id: string; name: string; when: string; window: string; facilitator: string; booked: number; held: number; rooms: number; st: Status }[] }
  | { kind: 'timeline'; title: string; start: number; end: number; today: number; todayLabel: string; items: { at: number; title: string; sub?: string; tone?: Tone }[] }
  | { kind: 'activity'; title: string; items: { at: string; actor: string; auto: boolean; text: string; guestId?: string; guest?: string }[] }
  | { kind: 'insights'; title: string; items: { id: string; tag: string; title: string; body: string; answer: string }[] }
  | { kind: 'chain'; title: string; steps: { title: string; sub?: string; tone?: Tone }[] }
  | { kind: 'note'; title?: string; text: string }

/** What one tool hands back: the cards to show, and a compact summary of the same facts for the model to read. */
export type ToolOutput = { blocks: Block[]; data: unknown }

const NARROW = new Set<Block['kind']>(['ring', 'fan', 'bars', 'note'])
/** A card that sits two to a row: a ring, a fan, a short bar chart or a note. Everything else takes the full width. */
export const isNarrow = (b: Block) => NARROW.has(b.kind) && !(b.kind === 'bars' && b.rows.length > 8)
