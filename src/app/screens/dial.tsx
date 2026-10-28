// The bird's-eye view as a screen: the app's data on one dial, with a card for each ring on a tendril that runs to the
// ring it reads. Pointing at a card lights its ring and quiets the others; pointing at a ring lights its card. Each
// card has one anatomy: its code and title, a Rajdhani figure and what it counts, its facts in two columns, one note
// worth reading, and a link to where that data lives. Before any data, the dial's rings are empty tracks and each card
// says what will fill its ring. The readings come from lib/dial-readings.ts.
import { useLayoutEffect, useRef, useState, type ReactNode } from 'react'
import { useNavigate } from 'react-router'
import { useItemsFor } from '@/hooks/use-items-for'
import { StateSwitch } from '@/components/system/state-switch'
import { readDial, WINDOW_DAYS } from '@/lib/dial-readings'
import { polar } from '@/lib/dial'
import { dateOf } from '@/lib/items'
import { openScreen, useScreens } from '@/stores/screens'
import { Dial, DIAL_BOX, DIAL_TAGS, type DialRing } from '@/components/system/dial'
import { FolderCard } from '@/components/system/folder-card'
import { Failed, Pending } from '@/components/system/empty'

const APP_NAME = import.meta.env.VITE_APP_NAME || 'App'
const RINGS: DialRing[] = [1, 2, 3, 4]

type Card = { code: string; title: string; figure: string; counts: string; facts: [string, string][]; note: string; link?: { label: string; go(el: HTMLElement): void } }

function Reading({ ring, card, hot, onHot, setRef, fault, loading }: { ring: DialRing; card: Card; hot: DialRing | null; onHot(r: DialRing | null): void; setRef(el: HTMLElement | null): void; fault: boolean; loading: boolean }) {
  const quiet = fault || loading
  return (
    <FolderCard
      ref={setRef}
      on={hot === ring}
      glow
      onPointerEnter={() => onHot(ring)}
      onPointerLeave={() => onHot(null)}
      onFocus={() => onHot(ring)}
      onBlur={() => onHot(null)}
      className={`transition-opacity duration-200 ${hot && hot !== ring ? 'opacity-55' : ''}`}
      bodyClassName="gap-2.5 !pb-4"
    >
      <div className="flex items-baseline gap-2">
        <code className="font-mono text-[11px]/none font-medium tracking-[0.04em] text-brand">[{card.code}]</code>
        <span className="text-[14px] font-semibold">{card.title}</span>
      </div>
      <div className="flex items-baseline gap-2.5">
        <b className={`font-figure text-[34px]/none font-medium tabular-nums ${quiet ? 'text-dim' : ''} ${loading ? 'animate-pulse' : ''}`}>{quiet ? '–' : card.figure}</b>
        <span className="text-[13px] text-dim">{card.counts}</span>
      </div>
      {loading ? (
        <Pending rows={1} className="pt-0.5" />
      ) : fault ? (
        <p className="border-t border-line pt-2.5 text-[13px]/[1.5] text-dim">No reading. This ring fills again once the data loads.</p>
      ) : (
        <>
          <dl className="grid grid-cols-[auto_minmax(0,1fr)] gap-x-4 gap-y-1 border-t border-line pt-2.5 text-[12.5px]">
            {card.facts.map(([k, v]) => (
              <div key={k} className="contents">
                <dt className="text-dim">{k}</dt>
                <dd className="text-right tabular-nums">{v}</dd>
              </div>
            ))}
          </dl>
          <p className="text-[13px]/[1.5] text-dim">{card.note}</p>
        </>
      )}
      {!quiet && card.link && (
        <button type="button" data-door={`dial-${ring}`} onClick={(e) => card.link!.go(e.currentTarget)} className="w-fit text-[13px] font-semibold text-brand underline-offset-4 hover:underline focus-visible:underline focus-visible:outline-none">
          {card.link.label} →
        </button>
      )}
    </FolderCard>
  )
}

/** The tendrils: from each card's head to the ring it reads, drawn over the layout. Wide layouts only. */
function Tendrils({ wrap, dial, cards, hot }: { wrap: HTMLElement | null; dial: HTMLElement | null; cards: (HTMLElement | null)[]; hot: DialRing | null }) {
  const [paths, setPaths] = useState<{ ring: DialRing; d: string; x: number; y: number }[]>([])
  useLayoutEffect(() => {
    if (!wrap || !dial) return
    const draw = () => {
      const w = wrap.getBoundingClientRect(), r = dial.getBoundingClientRect()
      // side by side only: a stacked phone layout leaves the cards under the dial, with no tendrils
      const first = cards[0]?.getBoundingClientRect()
      if (!first || first.left < r.right - 4) return setPaths([])
      const k = r.width / (DIAL_BOX * 2)
      setPaths(RINGS.map((ring, i) => {
        const c = cards[i]!.getBoundingClientRect()
        const [px, py] = polar(DIAL_TAGS[ring].r, DIAL_TAGS[ring].at)
        const x = r.left - w.left + (px + DIAL_BOX) * k, y = r.top - w.top + (py + DIAL_BOX) * k
        const cx = c.left - w.left, cy = c.top - w.top + 44
        return { ring, x, y, d: `M${cx} ${cy}H${cx - 18}C${cx - 70} ${cy} ${x + 60} ${y} ${x} ${y}` }
      }))
    }
    draw()
    const ro = new ResizeObserver(draw)
    ro.observe(wrap)
    cards.forEach((c) => c && ro.observe(c))
    document.fonts?.ready.then(draw)
    return () => ro.disconnect()
  }, [wrap, dial, cards])
  if (!paths.length) return null
  return (
    <svg className="pointer-events-none absolute inset-0 h-full w-full overflow-visible" aria-hidden="true">
      {paths.map((p) => (
        <g key={p.ring}>
          <path d={p.d} className="dl-tendril" data-hot={hot === p.ring ? '' : undefined} data-dim={hot && hot !== p.ring ? '' : undefined} />
          <circle cx={p.x} cy={p.y} r={4} className="dl-tendril-end" data-hot={hot === p.ring ? '' : undefined} />
        </g>
      ))}
    </svg>
  )
}

export function DialScreen() {
  // the dial and its cards read the data as one part, with one state switch
  const { data, isLoading, error, refetch } = useItemsFor('dial')
  const navigate = useNavigate()
  const [hot, setHot] = useState<DialRing | null>(null)
  const [wrap, setWrap] = useState<HTMLElement | null>(null)
  const [dial, setDial] = useState<HTMLElement | null>(null)
  const cardEls = useRef<(HTMLElement | null)[]>([null, null, null, null])
  const [cards, setCards] = useState<(HTMLElement | null)[]>([])
  const f = readDial(data?.items ?? [], APP_NAME)
  const toItems = () => {
    useScreens.getState().closeAll()
    navigate('/app/items')
  }
  const empty = !f.total

  const content: Record<DialRing, Card> = {
    1: {
      code: '01', title: 'Progress', figure: f.reading.big, counts: 'of the open work done',
      facts: [['Done', String(f.done)], ['Open', String(f.open)]],
      note: empty ? 'The band fills as items move to done. Add an item to start it.' : f.done === f.open ? 'Every open item is done.' : `${f.open - f.done} item${f.open - f.done === 1 ? '' : 's'} still to finish.`,
      link: { label: empty ? 'Add the first item' : 'Open Items', go: toItems },
    },
    2: {
      code: '02', title: 'Mix', figure: String(f.total), counts: f.total === 1 ? 'item by state' : 'items by state',
      facts: f.counts.map((c) => [c.word, String(c.n)]),
      note: empty ? 'Fifty cells, colored by how items split across states.' : 'Each cell is about 2 % of all items, in state order.',
      link: empty ? undefined : { label: 'See the list by state', go: toItems },
    },
    3: {
      code: '03', title: 'Activity', figure: String(f.changedThisWeek), counts: 'changed this week',
      facts: [['Items', String(f.total)], ['Latest', f.latest ? dateOf(f.latest.updated_at) : 'None yet']],
      note: empty ? 'The line runs as items are added or changed in the last 7 days.' : f.latest ? `Latest: ${f.latest.title}.` : '',
      link: f.latest ? { label: 'Open the latest change', go: (el) => openScreen('item', { id: f.latest!.id, part: 'dial' }, el) } : undefined,
    },
    4: {
      code: '04', title: 'Rhythm', figure: String(f.activeDays), counts: `of ${WINDOW_DAYS} days active`,
      facts: [['Window', `${WINDOW_DAYS} days`], ['Last change', f.sinceLast === null ? 'None yet' : f.sinceLast === 0 ? 'Today' : `${f.sinceLast} ${f.sinceLast === 1 ? 'day' : 'days'} ago`]],
      note: empty ? 'A cell a day, lit when something happens. The red needle marks the days since the last change.' : f.sinceLast !== null && f.sinceLast >= 7 ? 'Nothing has changed for a week. The dial reads Going quiet.' : 'The red needle marks the days since the last change.',
    },
  }

  // the card elements, kept in state once all four mount, so the tendrils redraw against them
  const setRef = (i: number) => (el: HTMLElement | null) => {
    cardEls.current[i] = el
    if (cardEls.current.every(Boolean) && cardEls.current.some((c, k) => c !== cards[k])) setCards([...cardEls.current])
  }

  const fault = !!error
  let lead: ReactNode = null
  if (fault)
    lead = (
      <Failed
        className="max-w-[620px]"
        title="The data did not load"
        detail="The dial reads the items API, which did not answer, so no ring shows a reading. Nothing was lost. In development, run npm run dev:full so the Pages Functions and the D1 database run beside the app."
        onRetry={() => void refetch()}
      />
    )

  return (
    <>
      <div className="flex flex-wrap items-start justify-between gap-x-6 gap-y-2">
      <p className="max-w-[70ch] text-[15px]/[1.55] text-dim">
        {isLoading ? 'Reading the data…' : fault ? 'The dial is offline until the data loads.' : empty ? 'Nothing recorded yet. Each ring shows what it will read; add an item and the dial comes alive.' : `${f.total} item${f.total === 1 ? '' : 's'}, ${f.reading.big} of the open work done, ${f.changedThisWeek} changed this week.`}
      </p>
      <StateSwitch part="dial" label="Bird’s-eye view" />
      </div>
      {lead}
      <div ref={setWrap} className="relative grid items-center justify-center gap-x-[clamp(40px,7vw,112px)] gap-y-6 grid-cols-[minmax(300px,540px)_minmax(260px,360px)] @max-[880px]/frame:grid-cols-1">
        <div ref={setDial} className="mx-auto w-full max-w-[540px] @max-[880px]/frame:max-w-[420px]">
          <Dial d={f.reading} id="dial" hot={hot} onHot={setHot} fault={fault} loading={isLoading} />
        </div>
        <div className="grid content-center gap-3.5">
          {RINGS.map((r, i) => (
            <Reading key={r} ring={r} card={content[r]} hot={hot} onHot={setHot} setRef={setRef(i)} fault={fault} loading={isLoading} />
          ))}
        </div>
        <Tendrils wrap={wrap} dial={dial} cards={cards} hot={hot} />
      </div>
    </>
  )
}
