// Ask: a conversation with Northlight OS. The admin team asks about anything the OS holds (guests, retreats, money,
// reviews, readiness, care, workload, the activity log, the discovery documents) and each answer comes back as a short
// written answer over cards: stats, charts, tables and records that open as screens. Claude answers through /api/ask;
// where that is not reachable, the built-in matcher answers and the answer says so (src/os/ask/engine.ts).
import { ArrowUp, Plus, RotateCcw, Sparkles, Trash2 } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { Panel } from '@/components/system/panel'
import { Failed } from '@/components/system/empty'
import { Sec } from '@/components/system/status'
import { cn } from '@/lib/utils/cn'
import { useOs } from '@/os/store'
import { ExampleNote, ViewHead } from '@/os/ui'
import { BlockCard } from '@/os/ask/cards'
import { useAsk, type Turn } from '@/os/ask/engine'
import { isNarrow, type Block } from '@/os/ask/blocks'

const STARTERS: { group: string; qs: string[] }[] = [
  { group: 'The business', qs: ['How are we doing today?', 'Where do guests drop off in the journey?', 'What did NL-OS automate this week?'] },
  { group: 'Guests', qs: ['Who is waiting on a medical review?', 'Who owes readiness forms?', 'Tell me about Isabel Cruz'] },
  { group: 'Retreats and money', qs: ['How full are the upcoming retreats?', 'What revenue is outstanding?', 'Where do our guests come from?'] },
  { group: 'Care and the team', qs: ['What needs the care team?', 'Who has the heaviest workload?', 'What is coming up in the next two weeks?'] },
]

/** Questions that follow naturally from what an answer showed, keyed by the first tool it used. */
const FOLLOW: Record<string, string[]> = {
  overview: ['What is most urgent?', 'How full are the upcoming retreats?', 'What revenue is outstanding?'],
  pipeline: ['Who is in medical review?', 'Where do our guests come from?', 'Who was lost or not approved?'],
  find_guests: ['What needs a person right now?', 'Who owes readiness forms?'],
  guest_profile: ['What happened with them recently?', 'What needs a person right now?'],
  needs: ['Who has the heaviest workload?', 'What is coming up this week?'],
  retreats: ['Who owes forms for the next retreat?', 'What revenue is outstanding?'],
  retreat_detail: ['Who owes readiness forms?', 'How full are the upcoming retreats?'],
  revenue: ['Who has unpaid invoices?', 'Show booked value by channel'],
  channels: ['Which referral partners send the most guests?', 'Where do guests drop off in the journey?'],
  medical_reviews: ['Who is waiting on a medical review?', 'What is the approval rate?'],
  readiness: ['How full are the upcoming retreats?', 'What is coming up this week?'],
  care: ['Who has the heaviest workload?', 'Which retention calls are due?'],
  staff_workload: ['What needs the care team?', 'What needs operations?'],
  activity: ['What did NL-OS automate this week?', 'What needs a person right now?'],
  automation_impact: ['Which manual steps remain today?', 'What are the intake insights?'],
  upcoming: ['Who owes readiness forms?', 'Which holds are about to lapse?'],
  blueprint: ['What did NL-OS automate this week?', 'What does today’s flowchart look like?'],
}

function Answer({ t, onAsk, last }: { t: Turn; onAsk(q: string): void; last: boolean }) {
  const retry = useAsk((s) => s.retry)
  const blocks: Block[] = t.parts.flatMap((p) => p.blocks)
  // small cards sit two to a row only beside another small card; a lone one takes the full width
  const paired: boolean[] = []
  for (let i = 0; i < blocks.length; i++) {
    if (isNarrow(blocks[i]) && i + 1 < blocks.length && isNarrow(blocks[i + 1])) { paired[i] = paired[i + 1] = true; i++ }
  }
  const follow = last && t.status === 'done' && t.parts[0] ? (FOLLOW[t.parts[0].tool] ?? []).slice(0, 3) : []
  return (
    <article className="grid gap-4" aria-busy={t.status === 'working'}>
      <div className="flex justify-end">
        <p className="max-w-[80%] rounded-[calc(var(--panel-radius)*0.9)] rounded-br-[6px] bg-text px-4 py-2.5 text-[14.5px]/[1.5] text-ground">{t.q}</p>
      </div>
      <div className="grid gap-4">
        <span className="flex items-center gap-2 text-[11px] tracking-[0.1em] text-dim uppercase">
          <Sparkles size={13} strokeWidth={1.5} aria-hidden="true" />
          {t.status === 'working' ? (
            <span className="inline-flex items-center gap-2" role="status">{t.step ?? 'Working'}<span className="inline-flex gap-1" aria-hidden="true">{[0, 1, 2].map((i) => <i key={i} className="block h-1 w-1 animate-pulse rounded-full bg-dim motion-reduce:animate-none" style={{ animationDelay: `${i * 180}ms` }} />)}</span></span>
          ) : t.engine === 'local' ? 'Built-in matcher' : 'Claude'}
        </span>
        {t.text && <p className="max-w-[68ch] text-[16.5px]/[1.6]">{t.text}</p>}
        {t.engine === 'local' && t.why && <p className="text-[12.5px]/[1.5] text-dim">{t.why} The built-in matcher answers from keywords and names, so open-ended questions get the closest overview.</p>}
        {blocks.length > 0 && (
          <div className="grid gap-4 @min-[760px]/frame:grid-cols-2">
            {blocks.map((b, i) => (
              <div key={i} className={cn('rise-in min-w-0', !paired[i] && '@min-[760px]/frame:col-span-2')} style={{ animationDelay: `${Math.min(i, 6) * 60}ms` }}>
                <BlockCard b={b} />
              </div>
            ))}
          </div>
        )}
        {t.status === 'error' && <Failed title="This answer did not finish" detail={t.error} onRetry={() => void retry(t.id)} />}
        {follow.length > 0 && (
          <div className="flex flex-wrap gap-2 pt-1">
            {follow.map((q) => <button key={q} type="button" className="rounded-full border border-line bg-panel px-3.5 py-1.5 text-[13px] transition-colors duration-(--dur-hover) hover:border-edge hover:bg-wash focus-visible:shadow-[0_0_0_2px_var(--focus)] focus-visible:outline-none" onClick={() => onAsk(q)}>{q}</button>)}
          </div>
        )}
      </div>
    </article>
  )
}

function Composer({ onAsk, busy }: { onAsk(q: string): void; busy: boolean }) {
  const [q, setQ] = useState('')
  const box = useRef<HTMLTextAreaElement>(null)
  useEffect(() => {
    const el = box.current
    if (!el) return
    el.style.height = 'auto'
    el.style.height = `${Math.min(el.scrollHeight, 240)}px`
  }, [q])
  const send = () => {
    if (!q.trim() || busy) return
    onAsk(q)
    setQ('')
  }
  return (
    <form
      onSubmit={(e) => { e.preventDefault(); send() }}
      className="flex items-end gap-3 rounded-[calc(var(--panel-radius)*1.2)] border border-line bg-panel p-3 pl-5 shadow-[var(--shadow-float)] focus-within:border-edge"
    >
      <label htmlFor="ask-q" className="sr-only">Ask about guests, retreats, money, reviews or care</label>
      <textarea
        id="ask-q"
        ref={box}
        rows={2}
        value={q}
        onChange={(e) => setQ(e.target.value)}
        onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey && !e.nativeEvent.isComposing) { e.preventDefault(); send() } }}
        placeholder="Ask about guests, retreats, money, reviews or care"
        className="max-h-[240px] min-h-[48px] flex-1 @min-[700px]/frame:min-h-[72px] resize-none bg-transparent py-2 text-[15px]/[1.5] text-text placeholder:text-dim focus:outline-none"
      />
      <button type="submit" disabled={!q.trim() || busy} className="pill go !h-11 !w-11 !min-w-0 !p-0" aria-label="Ask">
        <ArrowUp size={17} strokeWidth={1.75} aria-hidden="true" />
      </button>
    </form>
  )
}

export default function AskPage() {
  const { threads, activeId, ask, open, remove } = useAsk()
  const guests = useOs((s) => s.guests.length)
  const thread = threads.find((t) => t.id === activeId)
  const busy = !!thread?.turns.some((t) => t.status === 'working')
  const end = useRef<HTMLDivElement>(null)
  const turns = thread?.turns.length ?? 0
  useEffect(() => {
    if (turns) end.current?.scrollIntoView({ behavior: 'smooth', block: 'end' })
  }, [turns])
  const onAsk = (q: string) => void ask(q)

  return (
    <div className="arrive grid items-start gap-x-8 gap-y-6" style={{ gridTemplateColumns: 'var(--layout-hub)' }}>
      <ViewHead
        label={<>Ask · <ExampleNote /></>}
        title="Ask"
        lead={`Ask about any of the ${guests} guests, the retreats, money, reviews, care or the discovery documents. Answers come back as charts, tables and records you can open.`}
        side={thread ? <button type="button" className="pill sm" onClick={() => open(null)}><Plus size={13} strokeWidth={1.75} aria-hidden="true" /> New conversation</button> : undefined}
      />
      <section aria-label="Conversation" className="grid min-w-0 content-start gap-8 @max-[900px]/frame:col-span-full">
        {thread ? (
          thread.turns.map((t, i) => <Answer key={t.id} t={t} onAsk={onAsk} last={i === thread.turns.length - 1} />)
        ) : (
          <div className="grid gap-6">
            {STARTERS.map((g) => (
              <div key={g.group} className="grid gap-3">
                <Sec as="h3">{g.group}</Sec>
                <div className="grid gap-3 @min-[620px]/frame:grid-cols-3">
                  {g.qs.map((q) => (
                    <Panel key={q} as="button" type="button" live onClick={() => onAsk(q)} className="content-start !p-4 text-left text-[14.5px]/[1.45]">{q}</Panel>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
        <div ref={end} />
      </section>
      <aside className="grid min-w-0 content-start gap-4 @max-[900px]/frame:col-span-full" aria-labelledby="threads-h">
        <Sec id="threads-h">Conversations{threads.length ? ` · ${threads.length}` : ''}</Sec>
        {threads.length ? (
          <ul className="panel m-0 grid list-none !p-2">
            {threads.map((t) => (
              <li key={t.id} className="group flex items-center gap-1 border-t border-line first:border-t-0">
                <button type="button" onClick={() => open(t.id)} aria-current={t.id === activeId ? 'true' : undefined} className={cn('grid min-w-0 flex-1 gap-0.5 rounded-[calc(var(--panel-radius)*0.5)] px-3 py-2.5 text-left transition-colors duration-(--dur-hover) hover:bg-wash', t.id === activeId && 'bg-wash')}>
                  <span className="truncate text-[14px]">{t.title}</span>
                  <span className="text-[12px] text-dim">{t.turns.length} question{t.turns.length === 1 ? '' : 's'} · {new Date(t.at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>
                </button>
                <button type="button" onClick={() => remove(t.id)} className="round !h-8 !w-8 opacity-0 transition-opacity group-hover:opacity-100 focus-visible:opacity-100" aria-label={`Delete “${t.title}”`}>
                  <Trash2 size={13} strokeWidth={1.5} aria-hidden="true" />
                </button>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-[13.5px]/[1.55] text-dim">Your questions and their answers stay in this browser. Start with one of the questions on the left, or type your own.</p>
        )}
        {thread && thread.turns.some((t) => t.status === 'error') && (
          <p className="flex items-center gap-2 text-[12.5px] text-dim"><RotateCcw size={13} strokeWidth={1.5} aria-hidden="true" /> An answer that stopped offers a retry in place.</p>
        )}
      </aside>
      <div className="sticky bottom-[max(12px,env(safe-area-inset-bottom))] z-[2]" style={{ gridColumn: '1 / -1' }}>
        <Composer onAsk={onAsk} busy={busy} />
      </div>
    </div>
  )
}
