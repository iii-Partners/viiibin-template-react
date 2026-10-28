import { describe, it, expect } from 'vitest'
import { readDial } from '@/lib/dial-readings'
import type { Item } from '@/lib/api/items'

const NOW = Date.parse('2026-10-28T12:00:00Z')
const item = (id: number, status: string, created: string, updated: string): Item => ({ id, title: `Item ${id}`, description: null, status, created_at: created, updated_at: updated })

describe('readDial', () => {
  it('reads a fresh app as empty rings with nothing to divide by', () => {
    const f = readDial([], 'Harbor', NOW)
    expect(f.reading.pct).toBe(0)
    expect(f.reading.big).toBe('0%')
    expect(f.reading.word).toBe('No data yet')
    expect(f.reading.flow.label).toBe('No changes yet')
    expect(f.reading.days.every((d) => !d)).toBe(true)
    expect(f.reading.needle).toBeUndefined()
  })

  it('reads progress, mix, activity, rhythm and the needle from the items', () => {
    const f = readDial(
      [
        item(1, 'active', '2026-10-02 09:00:00', '2026-10-27 09:00:00'),
        item(2, 'done', '2026-10-01 09:00:00', '2026-10-19 09:00:00'),
        item(3, 'archived', '2026-10-01 09:00:00', '2026-10-03 09:00:00'),
      ],
      'Harbor',
      NOW,
    )
    // archived items leave the open work: 1 done of 2 open
    expect(f.reading.big).toBe('50%')
    expect(f.reading.mix.map((m) => m.n)).toEqual([1, 1, 1])
    expect(f.changedThisWeek).toBe(1)
    // Oct 19 and Oct 27 fall in the 14 days to Oct 28
    expect(f.activeDays).toBe(2)
    expect(f.sinceLast).toBe(1)
    expect(f.reading.word).toBe('Active')
  })

  it('reads a week without changes as going quiet', () => {
    const f = readDial([item(1, 'active', '2026-10-01 09:00:00', '2026-10-10 09:00:00')], 'Harbor', NOW)
    expect(f.reading.st).toBe('risk')
    expect(f.reading.word).toBe('Going quiet')
  })
})
