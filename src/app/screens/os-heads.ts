// The heads of the OS's screens: the kind over the title, and the status word, read from the live state. Kept apart
// from the screens' bodies (os.tsx) so that file exports components only.
import type { ScreenHead } from '@/components/shell/screen-dialog'
import { INSIGHTS, SESSIONS, STEPS } from '@/os/blueprint'
import { fmt, retreatName, STAGE } from '@/os/model'
import { useGuest, useOs, useRetreat } from '@/os/store'

export function useGuestHead(id?: string): ScreenHead {
  const g = useGuest(id)
  if (!g) return { kind: 'Guest', title: 'Guest not found' }
  return { kind: `Guest · ${STAGE[g.stage].owner} holds the next step`, title: g.name, st: STAGE[g.stage].st, word: STAGE[g.stage].word }
}

export function useRetreatHead(id?: string): ScreenHead {
  const r = useRetreat(id)
  const today = useOs((s) => s.today)
  if (!r) return { kind: 'Retreat', title: 'Retreat not found' }
  const on = r.start <= today && r.end >= today
  return { kind: `Retreat · ${fmt(r.start)} to ${fmt(r.end)}`, title: retreatName(r), st: on ? 'ok' : r.end < today ? 'done' : undefined, word: on ? 'On now' : r.end < today ? 'Ended' : undefined }
}

export function useStepHead(id?: string): ScreenHead {
  const s = id ? STEPS[id] : undefined
  return s ? { kind: `Today · ${s.section} · ${id}`, title: s.title } : { kind: 'Step', title: 'Step not found' }
}

export function useInsightHead(id?: string): ScreenHead {
  const ins = INSIGHTS.find((x) => x.id === id)
  return ins ? { kind: `Insight ${ins.id} · ${ins.kind}`, title: ins.title } : { kind: 'Insight', title: 'Insight not found' }
}

export function useSessionHead(n?: number): ScreenHead {
  const s = SESSIONS.find((x) => x.n === n)
  return s ? { kind: `Discovery ${s.n}/6 · ${s.code}`, title: s.name, st: s.state === 'held' ? 'done' : s.state === 'next' ? 'ok' : undefined, word: s.state === 'held' ? 'Held' : s.state === 'next' ? 'Up next' : undefined } : { kind: 'Session', title: 'Session not found' }
}
