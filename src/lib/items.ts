// An item's states as the design system reads them: each a status word, shape and color. The D1 column is free text;
// anything outside these three reads as active.
import type { ReelTone } from '@/components/system/charts/reel'
import type { Item } from '@/lib/api/items'

export type ItemState = 'active' | 'done' | 'archived'

export const ITEM_STATES: { id: ItemState; word: string; tone: ReelTone }[] = [
  { id: 'active', word: 'Active', tone: 'ok' },
  { id: 'done', word: 'Done', tone: 'done' },
  { id: 'archived', word: 'Archived', tone: 'quiet' },
]

export const stateOf = (item: Pick<Item, 'status'>): ItemState => (ITEM_STATES.some((s) => s.id === item.status) ? (item.status as ItemState) : 'active')

export const wordOf = (state: ItemState) => ITEM_STATES.find((s) => s.id === state)!.word

/** How many items sit in each state, in the states' order. */
export const countByState = (items: Item[]) => ITEM_STATES.map((s) => ({ ...s, n: items.filter((i) => stateOf(i) === s.id).length }))

export const dateOf = (iso: string) => new Date(iso.includes('T') ? iso : `${iso.replace(' ', 'T')}Z`).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
