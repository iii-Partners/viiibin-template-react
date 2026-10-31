import { beforeEach, describe, expect, it } from 'vitest'
import { useOs } from '@/os/store'
import { findNeeds } from '@/os/needs'
import { INSIGHTS, OS_FOR_SECTION, SECTIONS, STEPS, STEP_IDS } from '@/os/blueprint'
import { FORMS } from '@/os/model'

const os = () => useOs.getState()
const g = (id: string) => os().guests.find((x) => x.id === id)!
const needKeys = () => findNeeds(os().today, os().guests, os().retreats).map((n) => n.key)

beforeEach(() => os().reset())

describe('The journey, end to end', () => {
  it('takes a new inquiry through qualification, application, review, payment and preparation', () => {
    const id = os().addInquiry({ name: 'Test Guest', greeting: 'Test', email: 't@example.com', home: 'Highlands', channel: 'Direct inquiry' }, 'Test Guest')
    expect(g(id).stage).toBe('inquiry')
    os().qualify(id, 'one-off', 'A43', 'Silas')
    expect(g(id)).toMatchObject({ stage: 'application', price: 9500, hold: { retreatId: 'A43' } })
    os().submitApplication(id)
    expect(g(id).stage).toBe('review')
    os().decide(id, 'approved', 'Dr. Imani Brooks')
    expect(g(id).stage).toBe('agreement')
    expect(g(id).invoice?.number).toMatch(/^NL-\d+$/)
    os().signAgreement(id)
    expect(g(id).stage).toBe('agreement')
    os().payInvoice(id)
    expect(g(id)).toMatchObject({ stage: 'preparing', retreatId: 'A43', hold: undefined })
    expect(g(id).room).toBeGreaterThan(0)
    expect(Object.keys(g(id).forms)).toHaveLength(FORMS.length)
  })

  it('releases the hold when the Medical Team does not approve', () => {
    os().decide('g05', 'not-approved', 'Dr. Imani Brooks')
    expect(g('g05')).toMatchObject({ stage: 'not-approved', hold: undefined })
  })

  it('marks a session complete, starts care, and routes a one-off guest to retention', () => {
    os().saveNotes('g12', 'Notes', 'Noor Haddad')
    os().markComplete('g12', 'Mara')
    expect(g('g12')).toMatchObject({ stage: 'integration', sessionsUsed: 1, les: { status: 'scheduled' } })
    os().logCheckIn('g12', 'Maya Ruiz')
    os().finalizeCare('g12', 'Maya Ruiz')
    expect(g('g12').stage).toBe('retention')
    os().stop('g12', 'Silas')
    expect(g('g12').stage).toBe('inactive')
  })

  it('records what each event replaces in today’s flowchart, and every reference is a real step', () => {
    os().decide('g05', 'approved', 'Dr. Imani Brooks')
    const refs = os().events.flatMap((e) => e.replaces ?? [])
    expect(refs).toContain('M8')
    refs.forEach((r) => expect(STEPS[r]).toBeDefined())
  })
})

describe('The automations when a day passes', () => {
  it('moves preparing guests onto their retreat on its first day', () => {
    os().advanceDay() // Saturday, Oct 31
    os().advanceDay() // Sunday, Nov 1: A41 starts
    expect(g('g10').stage).toBe('retreat')
  })

  it('releases a hold once it expires', () => {
    expect(g('g03').hold).toBeDefined()
    os().advanceDay()
    os().advanceDay() // Nov 1 is the last day
    os().advanceDay()
    expect(g('g03').hold).toBeUndefined()
  })
})

describe('Needs you, from the example data', () => {
  it('finds the exceptions the documents predict', () => {
    const keys = needKeys()
    for (const k of ['g06-review', 'g04-stalled', 'g09-forms', 'g11-integrator', 'g16-retention', 'g14-checkin', 'g03-hold', 'g08-unpaid', 'g01-qualify'])
      expect(keys).toContain(k)
  })

  it('clears a need when its action is taken', () => {
    os().assignIntegrator('g11', 'Lena Sato', 'Rosa')
    expect(needKeys()).not.toContain('g11-integrator')
  })
})

describe('The blueprint data', () => {
  it('keeps all 59 steps of the flowchart, with every link resolving', () => {
    expect(STEP_IDS).toHaveLength(59)
    for (const id of STEP_IDS) for (const r of [...STEPS[id].next, ...STEPS[id].prev, ...STEPS[id].rel]) expect(STEPS[r], `${id} → ${r}`).toBeDefined()
  })

  it('names what NL-OS does for every lane, and every insight a step cites exists', () => {
    for (const s of SECTIONS) expect(OS_FOR_SECTION[s.name], s.name).toBeTruthy()
    const ids = new Set(INSIGHTS.map((i) => i.id))
    for (const id of STEP_IDS) for (const i of STEPS[id].ins) expect(ids.has(i)).toBe(true)
  })
})
