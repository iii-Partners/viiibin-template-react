// Retreats: the retreat board, Phase 1's first workflow in the Discovery Guide. Each retreat shows its window (A runs
// Sunday to Wednesday morning, B Wednesday afternoon to Saturday), its rooms as a grid (10 in Highlands, 8 in Europe),
// who is in each room and how ready they are, and who facilitates. Held rooms show apart from booked ones, so room
// inventory is never overstated (insight I05). A retreat opens as a screen with its manifest.
import { Tip } from '@/components/ui/tooltip'
import { openScreen } from '@/stores/screens'
import { Panel } from '@/components/system/panel'
import { Sec } from '@/components/system/status'
import { cn } from '@/lib/utils/cn'
import { daysBetween, fmt, FORMS, retreatName, RETREAT_WINDOW, type Guest, type Retreat } from '@/os/model'
import { useOs } from '@/os/store'
import { ExampleNote, ViewHead } from '@/os/ui'

/** A room as a square: the guest's initials and a readiness edge, a dashed square when held, empty when free. */
export function RoomGrid({ r, guests, today }: { r: Retreat; guests: Guest[]; today: string }) {
  const rooms = Array.from({ length: r.rooms }, (_, i) => i + 1)
  const inRoom = (n: number) => guests.find((g) => g.retreatId === r.id && g.room === n && !['inactive', 'not-approved', 'lost'].includes(g.stage))
  const held = guests.filter((g) => g.hold?.retreatId === r.id && !g.retreatId)
  let h = 0
  return (
    <div className="grid grid-cols-5 gap-1.5" aria-label={`Rooms on ${retreatName(r)}`}>
      {rooms.map((n) => {
        const g = inRoom(n)
        const hold = !g && h < held.length ? held[h++] : undefined
        const late = g && FORMS.some((f) => g.forms[f.id] && !g.forms[f.id]!.done && g.forms[f.id]!.due < today)
        const who = g ?? hold
        const label = who ? `Room ${n}: ${who.name}${hold ? ' (held)' : late ? ' (forms overdue)' : ''}` : `Room ${n}: free`
        return (
          <Tip key={n} label={label}>
          <span
            aria-label={label}
            className={cn(
              'grid aspect-square min-w-0 place-items-center rounded-[calc(var(--panel-radius)*0.4)] border text-[11px] font-medium tabular-nums',
              g ? (late ? 'border-fault bg-panel text-fault' : 'border-text bg-text text-ground') : hold ? 'border-dashed border-edge text-dim' : 'border-line text-dim/60',
            )}
          >
            {who ? who.name.split(' ').map((w) => w[0]).join('') : n}
          </span>
          </Tip>
        )
      })}
    </div>
  )
}

function RetreatCard({ r }: { r: Retreat }) {
  const { today, guests } = useOs()
  const booked = guests.filter((g) => g.retreatId === r.id && !['inactive', 'not-approved', 'lost'].includes(g.stage))
  const ready = booked.filter((g) => FORMS.every((f) => !g.forms[f.id] || g.forms[f.id]!.done)).length
  const until = daysBetween(today, r.start)
  return (
    <Panel as="button" type="button" live data-door={`retreat-${r.id}`} onClick={(e: React.MouseEvent<HTMLButtonElement>) => openScreen('retreat', { id: r.id }, e.currentTarget)} className="content-start gap-4 !p-5">
      <span className="flex items-baseline justify-between gap-3">
        <span className="eyebrow">{r.start <= today && r.end >= today ? 'On now' : until > 0 ? `In ${until} day${until === 1 ? '' : 's'}` : `Ended ${fmt(r.end)}`}</span>
        <span className="text-[12px] text-dim tabular-nums">{fmt(r.start)}–{fmt(r.end)}</span>
      </span>
      <span className="grid gap-1">
        <span className="font-display text-[22px]/[1.2] font-light">{retreatName(r)}</span>
        <span className="text-[13px] text-dim">{RETREAT_WINDOW[r.version]} · {r.facilitator}</span>
      </span>
      <RoomGrid r={r} guests={guests} today={today} />
      <span className="flex flex-wrap gap-x-4 gap-y-1 border-t border-line pt-3 text-[12.5px] text-dim">
        <span><b className="font-medium text-text tabular-nums">{booked.length}</b> of {r.rooms} booked</span>
        {booked.length > 0 && until > 0 && <span><b className="font-medium text-text tabular-nums">{ready}</b> fully ready</span>}
      </span>
    </Panel>
  )
}

export default function RetreatsPage() {
  const { today, retreats } = useOs()
  const sorted = [...retreats].sort((a, b) => a.start.localeCompare(b.start))
  const groups = [
    { id: 'now', word: 'On now', list: sorted.filter((r) => r.start <= today && r.end >= today) },
    { id: 'next', word: 'Coming up', list: sorted.filter((r) => r.start > today) },
    { id: 'past', word: 'Recently ended', list: sorted.filter((r) => r.end < today && daysBetween(r.end, today) <= 14).reverse() },
  ]
  return (
    <div className="arrive grid content-start gap-6">
      <ViewHead label={<>Operations · <ExampleNote /></>} title="Retreats" lead="The retreat board: every A and B retreat, its rooms, who is in them and how ready each guest is. A filled room is booked; a dashed room is held; coral means forms are overdue." />
      {groups.map((grp) =>
        grp.list.length ? (
          <section key={grp.id} className="grid gap-3.5" aria-labelledby={`rt-${grp.id}`}>
            <Sec id={`rt-${grp.id}`}>{grp.word} · {grp.list.length}</Sec>
            <div className="grid gap-4" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))' }}>
              {grp.list.map((r) => <RetreatCard key={r.id} r={r} />)}
            </div>
          </section>
        ) : null,
      )}
    </div>
  )
}
