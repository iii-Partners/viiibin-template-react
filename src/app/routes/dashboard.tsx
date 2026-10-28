// The dashboard: the hub. The work on the left (doors to every screen, the items by state, the getting-started
// track), Continue and Needs you on the right. A fresh account sees the same layout: Continue becomes Start here, the
// doors say what each one holds once used, and Needs you lists the getting-started steps. Every door grows its screen
// out of itself.
import { CircleCheck, Database, Gauge, Palette, Settings, UserRound } from 'lucide-react'
import { useNavigate } from 'react-router'
import { useItemsFor } from '@/hooks/use-items-for'
import { Previewable } from '@/components/system/state-switch'
import { useSteps } from '@/hooks/use-steps'
import { openScreen } from '@/stores/screens'
import { useOpenPlace } from '@/app/open-place'
import { type Step } from '@/lib/getting-started'
import { countByState, dateOf, stateOf, wordOf } from '@/lib/items'
import { Door } from '@/components/system/door'
import { FolderCard } from '@/components/system/folder-card'
import { ReelTrack } from '@/components/system/charts/reel'
import { Chain } from '@/components/system/charts/track'
import { Sec, StatusWord } from '@/components/system/status'
import { Empty, Failed, Pending } from '@/components/system/empty'
import { GrowButton, GrowOver, useGrowOver } from '@/components/system/grow-over'

// the dashboard reads its data as one part, so its state switch moves the whole view: counts, doors, Continue, needs
const PART = 'dashboard'

function useRunStep() {
  const navigate = useNavigate()
  const open = useOpenPlace()
  return (s: Step, el: Element | null) => (s.screen ? open(s.screen, undefined, el) : s.path && navigate(s.path))
}

function Continue() {
  const { data } = useItemsFor(PART)
  const steps = useSteps()
  const run = useRunStep()
  const next = steps.find((s) => s.done === false)
  const latest = data?.items.filter((i) => stateOf(i) === 'active').sort((a, b) => b.updated_at.localeCompare(a.updated_at))[0]
  if (latest)
    return (
      <FolderCard bodyClassName="gap-3">
        <Sec as="h2">Continue</Sec>
        <div className="grid gap-1">
          <b className="font-display text-[22px]/[1.25] font-medium tracking-[-0.02em]">{latest.title}</b>
          <span className="text-[13px] text-dim">
            <StatusWord st="ok">{wordOf(stateOf(latest))}</StatusWord> · changed {dateOf(latest.updated_at)}
          </span>
        </div>
        <button type="button" data-door="continue" className="gm-btn go w-fit" onClick={(e) => openScreen('item', { id: latest.id, part: PART }, e.currentTarget)}>
          Resume
        </button>
      </FolderCard>
    )
  return (
    <FolderCard bodyClassName="gap-3">
      <Sec as="h2">{next ? 'Start here' : 'Continue'}</Sec>
      <div className="grid gap-1">
        <b className="font-display text-[22px]/[1.25] font-medium tracking-[-0.02em]">{next ? next.title : 'You are set up'}</b>
        <p className="text-[13.5px]/[1.5] text-dim">{next ? next.why : 'Every getting-started step is done. Active items will show here to resume.'}</p>
      </div>
      {next && (
        <button type="button" data-door="continue" className="gm-btn go w-fit" onClick={(e) => run(next, e.currentTarget)}>
          {next.action}
        </button>
      )}
    </FolderCard>
  )
}

/** A step's context, grown over the set of needs: its action, why it matters, and the facts. */
function StepContext({ host, from, step, onClose, onRun }: { host: React.RefObject<HTMLDivElement | null>; from: HTMLElement; step?: Step; onClose(): void; onRun(s: Step, el: Element): void }) {
  if (!step) return null
  return (
    <GrowOver host={host} from={from} title={step.title} onClose={onClose}>
      <div className="grid gap-4">
        <span>
          <button type="button" className="btn go" onClick={(e) => onRun(step, e.currentTarget)}>
            {step.action}
          </button>
        </span>
        <div className="grid gap-3 border-t border-line pt-4">
          <p className="rise-in text-[14px]/[1.55] text-dim">{step.why}</p>
          <dl className="rise-in grid grid-cols-[auto_minmax(0,1fr)] gap-x-4 gap-y-1.5 text-[13px]" style={{ animationDelay: '40ms' }}>
            {step.facts.map(([k, v]) => (
              <div key={k} className="contents">
                <dt className="text-dim">{k}</dt>
                <dd className="text-right">{v}</dd>
              </div>
            ))}
          </dl>
        </div>
      </div>
    </GrowOver>
  )
}

function NeedsYou() {
  const steps = useSteps().filter((s) => s.done === false)
  const run = useRunStep()
  const grow = useGrowOver<string>()
  const { host, at } = grow
  return (
    <section className="grid gap-2.5" aria-labelledby="needs-h">
      <Sec id="needs-h">Needs you · {steps.length}</Sec>
      {steps.length ? (
        <div ref={host} className="relative grid gap-3">
          {steps.map((s) => (
            <FolderCard key={s.id} data-grow bodyClassName="gap-2 !pb-4">
              <StatusWord st="pending">Getting started</StatusWord>
              <b className="text-[15.5px]/[1.35] font-semibold">{s.title}</b>
              <div className="flex flex-wrap items-center gap-2">
                <button type="button" className="btn go" onClick={(e) => run(s, e.currentTarget)}>
                  {s.action}
                </button>
                <span className="ml-auto">
                  <GrowButton count={s.facts.length} onOpen={(card) => grow.open(s.id, card)} />
                </span>
              </div>
            </FolderCard>
          ))}
          {at && <StepContext host={host} from={at.from} step={steps.find((x) => x.id === at.key)} onClose={grow.close} onRun={run} />}
        </div>
      ) : (
        <Empty icon={CircleCheck} title="Nothing waits on you">
          Decisions and requests that need you land here, the most urgent first.
        </Empty>
      )}
    </section>
  )
}

function ItemsReel() {
  const { data, isLoading, error, refetch } = useItemsFor(PART)
  if (isLoading) return <FolderCard><Pending rows={2} /></FolderCard>
  if (error)
    return (
      <Failed
        code="ITM"
        label="Items"
        title="Items did not load"
        detail="The items API did not answer, so no count shows. Nothing was lost. In development, run npm run dev:full so the Pages Functions and the D1 database run beside the app."
        onRetry={() => void refetch()}
      />
    )
  const counts = countByState(data?.items ?? [])
  return (
    <ReelTrack
      code="ITM"
      big={data?.total ?? 0}
      label="Items"
      meta={data?.total ? 'By state, across every item' : undefined}
      segs={counts.map((c) => ({ label: c.word, n: c.n, st: c.tone }))}
      empty="Items appear here by state once you add the first one."
    />
  )
}

export default function DashboardPage() {
  const navigate = useNavigate()
  const open = useOpenPlace()
  const { data, isLoading, error } = useItemsFor(PART)
  const steps = useSteps()
  const done = steps.filter((s) => s.done).length
  const total = data?.total ?? 0
  const counts = countByState(data?.items ?? [])
  const reading = error
    ? 'Items did not load, so their counts are withheld. Everything else here still works.'
    : isLoading
      ? 'Counting the items…'
      : total
    ? `${total} item${total === 1 ? '' : 's'}: ${counts.filter((c) => c.n).map((c) => `${c.n} ${c.word.toLowerCase()}`).join(', ')}.`
    : done === steps.length
      ? 'Set up and ready. Add an item to start the counts.'
      : `${done} of ${steps.length} getting-started steps done. Start with the first one on the right.`
  const profileDone = steps.find((s) => s.id === 'profile')?.done
  const prefsDone = steps.find((s) => s.id === 'preferences')?.done

  return (
    <div className="arrive grid items-start gap-x-6 gap-y-5" style={{ gridTemplateColumns: 'var(--layout-hub)' }}>
      <div className="arrive grid min-w-0 content-start gap-5 @max-[900px]/frame:col-span-full">
        <div className="grid gap-1">
          <h1 className="text-[40px]/[1.05] font-light tracking-[-0.04em] @max-[700px]/frame:text-[30px]">Dashboard</h1>
          <p className="text-[14.5px] text-dim">{reading}</p>
        </div>
        <div className="grid gap-3" style={{ gridTemplateColumns: 'var(--layout-doors)' }}>
          <Door
            id="items"
            name="Items"
            icon={Database}
            n={error || isLoading ? undefined : total}
            st={error ? 'blocked' : total || isLoading ? 'ok' : 'pending'}
            word={error ? 'Did not load' : isLoading ? 'Counting…' : total ? `${counts[0].n} active` : 'Add the first'}
            onOpen={() => navigate('/app/items')}
          />
          <Door id="profile" name="Profile" icon={UserRound} st={profileDone ? 'done' : 'pending'} word={profileDone ? 'Complete' : 'Needs your details'} onOpen={(el) => open('profile', undefined, el)} />
          <Door id="settings" name="Settings" icon={Settings} st={prefsDone ? 'done' : 'pending'} word={prefsDone ? 'Set' : 'Pick a theme'} onOpen={(el) => open('settings', undefined, el)} />
          <Door id="dial" name="Bird’s-eye view" icon={Gauge} st={error ? 'blocked' : total ? 'ok' : 'pending'} word={error ? 'Offline' : isLoading ? 'Reading…' : total ? `${counts.find((c) => c.id === 'done')?.n ?? 0} done of ${total}` : 'Reads once data lands'} onOpen={(el) => open('dial', undefined, el)} />
          <Door id="design" name="Design system" icon={Palette} st="ok" word="Every part, every state" onOpen={(el) => open('design', undefined, el)} />
        </div>
        <Previewable part={PART} label="Dashboard">
          <ItemsReel />
        </Previewable>
        <FolderCard bodyClassName="gap-2">
          <code className="font-mono text-[11px]/none font-medium tracking-[0.04em] text-brand">[GO]</code>
          <span className="text-[14px] font-medium">Getting started · {done} of {steps.length}</span>
          <Chain
            label="Getting started"
            steps={steps.map((s, i) => ({ title: s.title, tone: s.done ? 'done' : i === steps.findIndex((x) => x.done === false) ? 'lit' : '' }))}
          />
        </FolderCard>
      </div>
      <aside className="grid min-w-0 content-start gap-5 @max-[900px]/frame:col-span-full">
        <Continue />
        <NeedsYou />
      </aside>
    </div>
  )
}
