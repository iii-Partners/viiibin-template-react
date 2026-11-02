// Ask's tools and built-in matcher, on the example data: every tool the contract offers Claude exists and answers with
// cards, the matcher routes common questions to the right tools, and no tool hands clinical notes to the model.
import { describe, expect, it } from 'vitest'
import { ASK_TOOLS } from '@/os/ask/contract'
import { findGuest, findRetreat, runTool, TOOLS, type Snapshot } from '@/os/ask/tools'
import { plan, sentence } from '@/os/ask/local'
import { SEED_EVENTS, SEED_GUESTS, SEED_RETREATS, SEED_TODAY } from '@/os/seed'

const snap: Snapshot = { today: SEED_TODAY, guests: structuredClone(SEED_GUESTS), retreats: structuredClone(SEED_RETREATS), events: structuredClone(SEED_EVENTS) }
const tools = (q: string) => plan(snap, q).map((c) => c.name)

describe('Ask tools', () => {
  it('the contract and the browser offer the same tools', () => {
    expect(ASK_TOOLS.map((t) => t.name).sort()).toEqual(Object.keys(TOOLS).sort())
  })

  it.each(ASK_TOOLS.map((t) => t.name))('%s answers with cards and a summary, with no input at all', (name) => {
    const out = runTool(snap, name, {})
    expect(out.error).toBeUndefined()
    expect(out.blocks.length).toBeGreaterThan(0)
    expect(out.data).not.toBeNull()
  })

  it('finds guests and retreats the way people name them', () => {
    const g = snap.guests[0]
    expect(findGuest(snap, g.name.toLowerCase())?.id).toBe(g.id)
    expect(findGuest(snap, g.name.split(' ')[1])?.id).toBe(g.id)
    expect(findRetreat(snap, 'A41')?.id).toBe('A41')
    expect(findRetreat(snap, 'Retreat B #41')?.id).toBe('B41')
    expect(findRetreat(snap, 'europe 12')?.id).toBe('E12')
  })

  it('opens one guest in full, and says so when the name is unknown', () => {
    const g = snap.guests.find((x) => x.stage === 'preparing')!
    const out = runTool(snap, 'guest_profile', { guest: g.name })
    expect(out.blocks[0]).toMatchObject({ kind: 'guest', id: g.id })
    expect(runTool(snap, 'guest_profile', { guest: 'Nobody Here' }).blocks[0].kind).toBe('note')
  })

  it('never hands clinical notes or flags to the model', () => {
    const withNotes = { ...snap, guests: snap.guests.map((g) => ({ ...g, medical: { ...g.medical, summary: 'PRIVATE-SUMMARY', flags: ['PRIVATE-FLAG'] } })) }
    for (const name of Object.keys(TOOLS)) {
      for (const g of withNotes.guests.slice(0, 4)) {
        const text = JSON.stringify(runTool(withNotes, name, { guest: g.name }))
        expect(text).not.toContain('PRIVATE-SUMMARY')
        expect(text).not.toContain('PRIVATE-FLAG')
      }
    }
  })

  it('an unknown tool or bad input comes back as an error, not a crash', () => {
    expect(runTool(snap, 'nope', {}).error).toBeTruthy()
    expect(() => runTool(snap, 'find_guests', { stages: 'not-a-list', limit: -4 })).not.toThrow()
  })
})

describe('the built-in matcher', () => {
  it.each([
    ['How are we doing today?', 'overview'],
    ['Who is waiting on a medical review?', 'medical_reviews'],
    ['What revenue is outstanding?', 'revenue'],
    ['Who owes readiness forms?', 'readiness'],
    ['How full are the upcoming retreats?', 'retreats'],
    ['Where do our guests come from?', 'channels'],
    ['Who has the heaviest workload?', 'staff_workload'],
    ['What did NL-OS automate this week?', 'automation_impact'],
    ['Where do guests drop off in the journey?', 'pipeline'],
    ['Tell me about Isabel Cruz', 'guest_profile'],
    ['Who is booked on A41?', 'retreat_detail'],
    ['What are the intake insights?', 'blueprint'],
  ])('“%s” uses %s', (q, tool) => {
    expect(tools(q)).toContain(tool)
  })

  it('falls back to the overview for a question it cannot place', () => {
    expect(tools('Tell me a poem about the sea')).toEqual(['overview'])
  })

  it('writes a sentence for every tool', () => {
    for (const name of Object.keys(TOOLS)) expect(sentence(name, runTool(snap, name, {}).data as Record<string, unknown>)).not.toBe('')
  })
})
