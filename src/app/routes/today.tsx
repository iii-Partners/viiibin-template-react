// Today: the operations desk (Mara, Iris, June, and Silas for sales). Where every guest is in the journey,
// the retreats coming up, what needs a person today, and what NL-OS did on its own. The clock in the head advances
// the prototype a day, so reminders, hold expiry, chasers and check-ins run and the view changes with them.
import { BedDouble, ClipboardList, Stethoscope, Users } from 'lucide-react'
import { useNavigate } from 'react-router'
import { openScreen } from '@/stores/screens'
import { Door } from '@/components/system/door'
import { Panel } from '@/components/system/panel'
import { Sec } from '@/components/system/status'
import { StageChart } from '@/components/system/charts/stage-chart'
import { daysBetween, fmt, ACTIVE_STAGES, FORMS, retreatName, RETREAT_WINDOW } from '@/os/model'
import { useOs } from '@/os/store'
import { useNeeds } from '@/os/needs'
import { ActivityLog, Clock, ExampleNote, NeedList, ViewHead } from '@/os/ui'

export default function TodayPage() {
  const navigate = useNavigate()
  const { today, guests, retreats, events } = useOs()
  const needs = useNeeds(['operations', 'sales'])
  const clinical = useNeeds('clinical')
  const active = guests.filter((g) => ACTIVE_STAGES.some((s) => s.id === g.stage))
  const upcoming = retreats.filter((r) => r.end >= today).sort((a, b) => a.start.localeCompare(b.start)).slice(0, 4)
  const thisWeek = upcoming.filter((r) => daysBetween(today, r.start) <= 7)
  const overdue = guests.filter((g) => g.stage === 'preparing' && FORMS.some((f) => g.forms[f.id] && !g.forms[f.id]!.done && g.forms[f.id]!.due < today)).length
  const urgent = needs.filter((n) => n.st === 'blocked' || n.st === 'risk').length

  return (
    <div className="arrive grid items-start gap-x-8 gap-y-6" style={{ gridTemplateColumns: 'var(--layout-hub)' }}>
      <ViewHead
        label={<>Operations · <ExampleNote /></>}
        title="Today"
        lead={`${active.length} guests are on the journey. ${needs.length} things need operations or sales${urgent ? `, ${urgent} of them overdue or at risk` : ''}.`}
        side={<Clock />}
      />
      <div className="arrive grid min-w-0 content-start gap-6 @max-[900px]/frame:col-span-full">
        <div className="grid gap-4" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))' }}>
          <Door id="today-guests" name="Guests" icon={Users} n={active.length} word="On the journey now" onOpen={() => navigate('/app/guests')} />
          <Door id="today-reviews" name="Medical reviews" icon={Stethoscope} n={guests.filter((g) => g.stage === 'review').length} st={clinical.some((n) => n.st === 'blocked') ? 'blocked' : 'ok'} word={clinical.some((n) => n.st === 'blocked') ? 'One is past its target' : 'Inside the target'} onOpen={() => navigate('/app/reviews')} />
          <Door id="today-retreats" name="Retreats this week" icon={BedDouble} n={thisWeek.length} word={thisWeek.map((r) => `${r.version} #${r.number}`).join(' · ') || 'None this week'} onOpen={() => navigate('/app/retreats')} />
          <Door id="today-forms" name="Readiness" icon={ClipboardList} n={overdue} st={overdue ? 'blocked' : 'ok'} word={overdue ? 'Guests with forms overdue' : 'Every checklist on time'} onOpen={() => navigate('/app/retreats')} />
        </div>
        <StageChart
          code="JRN"
          label="Guests by stage"
          meta="Each stage is one field with a date. Today the same journey spans 24 PipeCRM stages and a set of tags."
          stages={ACTIVE_STAGES.map((s) => ({ name: s.word, n: guests.filter((g) => g.stage === s.id).length, tone: needs.some((n) => guests.find((g) => g.id === n.guestId)?.stage === s.id && n.st === 'blocked') ? 'blocked' : '' }))}
        />
        <section className="grid gap-3.5" aria-labelledby="retreats-h">
          <Sec id="retreats-h">Retreats coming up</Sec>
          <div className="grid gap-4" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))' }}>
            {upcoming.map((r) => {
              const booked = guests.filter((g) => g.retreatId === r.id && ['preparing', 'retreat'].includes(g.stage))
              const held = guests.filter((g) => g.hold?.retreatId === r.id)
              const on = r.start <= today
              return (
                <Panel key={r.id} as="button" type="button" live data-door={`retreat-${r.id}`} onClick={(e: React.MouseEvent<HTMLButtonElement>) => openScreen('retreat', { id: r.id }, e.currentTarget)} className="content-start gap-3 !p-5">
                  <span className="eyebrow">{on ? 'On now' : `In ${daysBetween(today, r.start)} days`} · {fmt(r.start)}–{fmt(r.end)}</span>
                  <span className="font-display text-[22px]/[1.2] font-light">{retreatName(r)}</span>
                  <span className="text-[13px] text-dim">{RETREAT_WINDOW[r.version]} · {r.facilitator}</span>
                  <span className="flex items-baseline gap-2 border-t border-line pt-3">
                    <b className="figure text-[32px]/none">{booked.length}</b>
                    <span className="text-[13px] text-dim">of {r.rooms} rooms booked{held.length ? `, ${held.length} held` : ''}</span>
                  </span>
                </Panel>
              )
            })}
          </div>
        </section>
      </div>
      <aside className="grid min-w-0 content-start gap-7 @max-[900px]/frame:col-span-full">
        <section className="grid gap-3.5" aria-labelledby="needs-h">
          <Sec id="needs-h">Needs you · {needs.length}</Sec>
          <NeedList needs={needs} limit={5} empty="Nothing waits on operations or sales. Exceptions land here, the most urgent first." />
        </section>
        <section className="grid gap-3.5" aria-labelledby="log-h">
          <Sec id="log-h">What happened</Sec>
          <Panel className="!p-5">
            <ActivityLog events={events} limit={7} />
          </Panel>
        </section>
      </aside>
    </div>
  )
}
