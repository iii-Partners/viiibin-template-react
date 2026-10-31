// The catalog: every part of the design system with its four states. The Design system screen renders it (each part
// with its own state switch), and a test renders every part in every state, so a part cannot join without all four.
//   happy    the data an app has once it is in use
//   empty    a fresh app: no data yet. Still says what will appear and offers the first step.
//   loading  the data is on its way. Keeps the part's shape, so nothing jumps when it lands.
//   error    the data did not come. Says what failed and offers a retry.
// To add a part: build it in src/components/system, export it from src/components/system/index.ts, and add an entry
// here with all four states. The example data is invented and marked as such on the screen.
import type { ReactNode } from 'react'
import { CircleCheck, Database, Inbox, Palette } from 'lucide-react'
import {
  Bars, Blank, Chain, Chip, Door, Empty, Failed, Fan, Handoffs, Panel, Pending, PendingCard, ReelTrack, Ring, Sec,
  StageChart, StatusWord, Timeline, type Status,
} from '@/components/system'
import { cn } from '@/lib/utils/cn'

export type SpecState = 'happy' | 'empty' | 'loading' | 'error'
export const SPEC_STATES: { id: SpecState; word: string }[] = [
  { id: 'happy', word: 'Happy path' },
  { id: 'empty', word: 'Empty' },
  { id: 'loading', word: 'Loading' },
  { id: 'error', word: 'Error' },
]

export type SpecGroup = 'Charts' | 'Cards and lists' | 'Feedback and forms'

export interface Spec {
  id: string
  name: string
  group: SpecGroup
  /** when to reach for it, in one sentence */
  use: string
  /** what to import, and from where */
  from: string
  states: Record<SpecState, () => ReactNode>
}

const retry = () => {}
const STATUSES: Status[] = ['ok', 'risk', 'blocked', 'pending', 'paused', 'done']

/** The list row the views use: a name over a line, its status word, a chevron. */
function Rows({ rows }: { rows: { t: string; sub: string; st: Status }[] }) {
  return (
    <ul className="m-0 grid list-none p-0">
      {rows.map((r) => (
        <li key={r.t} className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-x-5 border-t border-line px-4 py-4 first:border-t-0">
          <span className="grid min-w-0 gap-1">
            <span className="truncate font-display text-[19px]/[1.25] font-light">{r.t}</span>
            <span className="truncate text-[13px] text-dim">{r.sub}</span>
          </span>
          <StatusWord st={r.st} />
        </li>
      ))}
    </ul>
  )
}

function Field({ value, error, busy }: { value: string; error?: string; busy?: boolean }) {
  return (
    <div className="grid gap-3">
      <div>
        <label className="label" htmlFor={`f-${value || 'empty'}-${error ? 'e' : ''}${busy ? 'b' : ''}`}>Title</label>
        <input id={`f-${value || 'empty'}-${error ? 'e' : ''}${busy ? 'b' : ''}`} className={cn('field', error && '!border-fault')} defaultValue={value} placeholder="What is it?" disabled={busy} aria-invalid={!!error} />
        {error && <p className="mt-1 text-[13px] text-fault">{error}</p>}
      </div>
      <button type="button" className="pill go w-fit" disabled={busy || !value}>
        {busy ? 'Saving…' : 'Save'}
      </button>
    </div>
  )
}

export const CATALOG: Spec[] = [
  // charts
  {
    id: 'reel', name: 'Reel', group: 'Charts', from: 'ReelTrack · @/components/system',
    use: 'A count cut by status, with a comparison track. Leads a view or a screen.',
    states: {
      happy: () => <ReelTrack code="ITM" big={42} label="Items" meta="Across every state" segs={[{ label: 'Active', n: 24, st: 'ok' }, { label: 'At risk', n: 6, st: 'risk' }, { label: 'Done', n: 12, st: 'done' }]} compare={{ share: 0.62, label: '62 % of the plan' }} />,
      empty: () => <ReelTrack code="ITM" big={0} label="Items" segs={[{ label: 'Active', n: 0, st: 'ok' }, { label: 'At risk', n: 0, st: 'risk' }, { label: 'Done', n: 0, st: 'done' }]} empty="Items appear here by state as you add them." />,
      loading: () => <PendingCard code="ITM" label="Items" />,
      error: () => <Failed code="ITM" label="Items" title="Items did not load" detail="The items API did not answer. Check that it runs, then try again." onRetry={retry} />,
    },
  },
  {
    id: 'stage', name: 'Stage chart', group: 'Charts', from: 'StageChart · @/components/system',
    use: 'Work moving through counted stages; a funnel shows each stage’s share of the one before.',
    states: {
      happy: () => <StageChart code="FUN" label="Visitors this week" stages={[{ name: 'Visited', n: 1240 }, { name: 'Signed up', n: 310 }, { name: 'Activated', n: 122, tone: 'lit' }, { name: 'Paid', n: 18 }]} />,
      empty: () => <StageChart code="FUN" label="Visitors this week" stages={[{ name: 'Visited', n: 0 }, { name: 'Signed up', n: 0 }, { name: 'Activated', n: 0 }, { name: 'Paid', n: 0 }]} empty="Counts arrive once analytics is on." />,
      loading: () => <PendingCard code="FUN" label="Visitors this week" rows={3} />,
      error: () => <Failed code="FUN" label="Visitors this week" title="The funnel did not load" detail="The analytics source refused the request. Check its key, then try again." onRetry={retry} />,
    },
  },
  {
    id: 'fan', name: 'Fan', group: 'Charts', from: 'Fan · @/components/system',
    use: 'A whole and its parts, largest darkest: cost by service, a project’s phases.',
    states: {
      happy: () => <Panel><Fan label="Cost by service" total="$1,280" totalLabel="Spent this month" parts={[{ name: 'Hosting', value: '$640', share: 0.5 }, { name: 'Email', value: '$380', share: 0.3 }, { name: 'SMS', value: '$260', share: 0.2, st: 'risk', note: 'Over budget' }]} /></Panel>,
      empty: () => <Panel><Fan label="Cost by service" total="$0" totalLabel="Spent this month" parts={[]} empty="Each service shows its share once its first bill lands." /></Panel>,
      loading: () => <PendingCard label="Spent this month" rows={3} />,
      error: () => <Failed label="Spent this month" title="Costs did not load" detail="The billing export is missing for this month." onRetry={retry} />,
    },
  },
  {
    id: 'track', name: 'Track and timeline', group: 'Charts', from: 'Chain, Timeline · @/components/system',
    use: 'Steps on a rail filled to now; a timeline places them on a scale with a Today line.',
    states: {
      happy: () => <Panel><Timeline label="Launch plan" start={0} end={12} today={5} todayLabel="Today · week 5" items={[{ at: 0, title: 'Kickoff', tone: 'done' }, { at: 3, title: 'Design', tone: 'done' }, { at: 6, title: 'Build', tone: 'lit' }, { at: 9, title: 'Beta', tone: 'watch' }, { at: 12, title: 'Launch' }]} /></Panel>,
      empty: () => <Panel><Chain label="Launch plan" steps={[{ title: 'Kickoff' }, { title: 'Design' }, { title: 'Build' }, { title: 'Beta' }, { title: 'Launch' }]} /></Panel>,
      loading: () => <PendingCard label="Launch plan" />,
      error: () => <Failed label="Launch plan" title="The plan did not load" detail="The plan’s dates could not be read." onRetry={retry} />,
    },
  },
  {
    id: 'handoffs', name: 'Handoffs', group: 'Charts', from: 'Handoffs · @/components/system',
    use: 'Each stage as a share of the one before: motion (activity) in ink, delivery (results) in ocean blue.',
    states: {
      happy: () => <Panel><Handoffs label="Sign-up flow" rows={[{ name: 'Visits', n: 900, kind: 'motion' }, { name: 'Started sign-up', n: 210, kind: 'motion' }, { name: 'Confirmed email', n: 160, kind: 'delivery' }]} /></Panel>,
      empty: () => <Panel><Handoffs label="Sign-up flow" rows={[{ name: 'Visits', n: 0, kind: 'motion' }, { name: 'Started sign-up', n: 0, kind: 'motion' }, { name: 'Confirmed email', n: 0, kind: 'delivery' }]} /></Panel>,
      loading: () => <PendingCard label="Sign-up flow" rows={3} />,
      error: () => <Failed label="Sign-up flow" title="The flow did not load" detail="Events stopped arriving at 09:40. Check the tracking script." onRetry={retry} />,
    },
  },
  {
    id: 'bars', name: 'Bars', group: 'Charts', from: 'Bars · @/components/system',
    use: 'Readings against a target, in SVG; rows can open their record.',
    states: {
      happy: () => <Panel><Bars label="Response time" max={800} mark={400} markLabel="Target 400 ms" rows={[{ name: 'Home', v: 220, label: '220 ms' }, { name: 'Search', v: 480, label: '480 ms', tone: 'watch' }, { name: 'Checkout', v: 760, label: '760 ms', tone: 'blocked' }]} /></Panel>,
      empty: () => <Panel><Blank>Bars appear once the first measurement lands.</Blank></Panel>,
      loading: () => <PendingCard label="Response time" />,
      error: () => <Failed label="Response time" title="Timings did not load" detail="The monitor returned no data for the last hour." onRetry={retry} />,
    },
  },
  {
    id: 'ring', name: 'Ring', group: 'Charts', from: 'Ring · @/components/system',
    use: 'One share against a plan, as a gauge.',
    states: {
      happy: () => <Panel className="justify-items-center"><Ring value={0.61} plan={0.68} big="61%" unit="Complete" sub="Plan 68%" label="61 percent complete against 68 percent planned" /></Panel>,
      empty: () => <Panel className="justify-items-center"><Ring value={0} big="0%" unit="Complete" sub="No plan set" label="Nothing complete yet" /></Panel>,
      loading: () => <PendingCard label="Complete" />,
      error: () => <Failed label="Complete" title="The gauge did not load" detail="The plan could not be read." onRetry={retry} />,
    },
  },
  // cards and lists
  {
    id: 'door', name: 'Door', group: 'Cards and lists', from: 'Door · @/components/system',
    use: 'The way into a screen or view: a live panel with its name, status word, count and icon.',
    states: {
      happy: () => <div className="grid gap-3 sm:grid-cols-2"><Door id="cat-items" name="Items" icon={Database} n={42} st="ok" word="24 active" onOpen={() => {}} /><Door id="cat-design" name="Design system" icon={Palette} st="ok" word="Every part" onOpen={() => {}} /></div>,
      empty: () => <div className="grid gap-3 sm:grid-cols-2"><Door id="cat-items-e" name="Items" icon={Database} n={0} st="pending" word="Add the first" onOpen={() => {}} /></div>,
      loading: () => <div className="grid gap-3 sm:grid-cols-2"><PendingCard label="Items" rows={1} /></div>,
      error: () => <div className="grid gap-3 sm:grid-cols-2"><Door id="cat-items-x" name="Items" icon={Database} st="blocked" word="Did not load" onOpen={() => {}} /></div>,
    },
  },
  {
    id: 'list', name: 'Status list', group: 'Cards and lists', from: 'a .panel with rows · see Items view',
    use: 'Records with their status word; each row opens its record as a screen.',
    states: {
      happy: () => <div className="panel !p-2"><Rows rows={[{ t: 'Supplier contract renewal', sub: 'Renews January 1', st: 'ok' }, { t: 'Spring catalog photos', sub: 'Waiting on the photographer', st: 'risk' }, { t: 'Accessibility audit', sub: 'WCAG 2.1 AA', st: 'done' }]} /></div>,
      empty: () => <div className="panel !p-2"><Empty icon={Database} title="No items yet" className="m-2 border-none">An item is one record. Add the first with the form; it lands here.</Empty></div>,
      loading: () => <div className="panel !p-2"><Pending rows={3} className="p-4" /></div>,
      error: () => <Failed label="All items" title="The list did not load" detail="The items API did not answer. Check that it runs, then try again." onRetry={retry} />,
    },
  },
  {
    id: 'needs', name: 'Needs you', group: 'Cards and lists', from: 'Panel, StatusWord, GrowButton · @/components/system',
    use: 'What waits on the viewer, most urgent first, each with its action.',
    states: {
      happy: () => (
        <div className="grid gap-3">
          <Sec>Needs you · 2</Sec>
          {['Approve the spring catalog', 'Answer the supplier’s question'].map((t) => (
            <Panel key={t} className="gap-3 !p-5"><StatusWord st="pending">Decision</StatusWord><b className="font-display text-[22px]/[1.2] font-light">{t}</b><span><button type="button" className="pill sm">Open</button></span></Panel>
          ))}
        </div>
      ),
      empty: () => <div className="grid gap-3"><Sec>Needs you · 0</Sec><Empty icon={CircleCheck} title="Nothing waits on you">Decisions and requests that need you land here, the most urgent first.</Empty></div>,
      loading: () => <div className="grid gap-3"><Sec>Needs you</Sec><PendingCard label="Checking what waits on you" rows={2} /></div>,
      error: () => <div className="grid gap-3"><Sec>Needs you</Sec><Failed label="Requests for you" title="Needs did not load" detail="Requests could not be read. Nothing was lost." onRetry={retry} /></div>,
    },
  },
  // feedback and forms
  {
    id: 'status', name: 'Status words and chips', group: 'Feedback and forms', from: 'StatusWord, Chip · @/components/system',
    use: 'Status as a word, a shape and a color together. A color never stands alone.',
    states: {
      happy: () => <Panel className="gap-3"><div className="flex flex-wrap gap-3">{STATUSES.map((s) => <StatusWord key={s} st={s} />)}</div><div className="flex flex-wrap gap-2">{STATUSES.map((s) => <Chip key={s} st={s} />)}</div></Panel>,
      empty: () => <Panel className="gap-3"><span className="eyebrow">No status yet</span><Blank>A status appears once the work has started.</Blank></Panel>,
      loading: () => <Panel><Pending rows={1} /></Panel>,
      error: () => <Panel className="gap-3"><StatusWord st="blocked">Status unknown</StatusWord><p className="text-[13px] text-dim">The status could not be read, so none is shown in its place.</p></Panel>,
    },
  },
  {
    id: 'form', name: 'Field and button', group: 'Feedback and forms', from: '.field, .label, .pill · src/styles/design.css',
    use: 'A tracked label over a square field on its hairline edge; the primary action is a solid ink pill.',
    states: {
      happy: () => <Panel><Field value="Spring catalog photos" /></Panel>,
      empty: () => <Panel><Field value="" /></Panel>,
      loading: () => <Panel><Field value="Spring catalog photos" busy /></Panel>,
      error: () => <Panel><Field value="" error="Add a title. It names the item everywhere it shows." /></Panel>,
    },
  },
  {
    id: 'empty', name: 'Empty, loading and failed', group: 'Feedback and forms', from: 'Empty, Blank, Pending, PendingCard, Failed · @/components/system',
    use: 'The defaults every place falls back to: what will show here, its shape while loading, what failed.',
    states: {
      happy: () => <Empty icon={Inbox} title="Nothing waits on you" action={<button type="button" className="pill go">Open settings</button>}>New requests for a decision land here, newest first.</Empty>,
      empty: () => <Blank>Bars appear once the first measurement lands.</Blank>,
      loading: () => <PendingCard code="ITM" label="Items" />,
      error: () => <Failed title="The list did not load" detail="The API did not answer. Check that it runs, then try again." onRetry={retry} />,
    },
  },
]

export const GROUPS: SpecGroup[] = ['Charts', 'Cards and lists', 'Feedback and forms']
