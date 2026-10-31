// Guests: every guest by stage, one record each (insight I02). The list filters by stage; a row opens the guest's
// record as a screen. The form on the right adds an inquiry with the channel, the referrer and the greeting as three
// fields, where today the referrer's name doubles as the text greeting (insight I01).
import { useState } from 'react'
import { toast } from 'sonner'
import { openScreen } from '@/stores/screens'
import { Panel } from '@/components/system/panel'
import { Sec } from '@/components/system/status'
import { ACTIVE_STAGES, STAGES, type Channel, type StageId } from '@/os/model'
import { useOs } from '@/os/store'
import { ACTOR, ExampleNote, GuestList, ViewHead } from '@/os/ui'

const CHANNELS: Channel[] = ['Direct inquiry', 'Referral partner', 'Salesperson', 'Elan']

function NewInquiry() {
  const addInquiry = useOs((s) => s.addInquiry)
  const [f, setF] = useState({ name: '', greeting: '', email: '', home: '', channel: 'Referral partner' as Channel, referrer: '' })
  const set = (k: keyof typeof f) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => setF({ ...f, [k]: e.target.value })
  const submit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!f.name.trim()) return
    const id = addInquiry({ ...f, name: f.name.trim(), greeting: f.greeting.trim() || f.name.trim().split(' ')[0], referrer: f.referrer.trim() || undefined }, ACTOR.operations)
    toast.success(`${f.name.trim()} added as an inquiry`)
    setF({ ...f, name: '', greeting: '', email: '', home: '', referrer: '' })
    openScreen('guest', { id })
  }
  return (
    <Panel band className="gap-5 !p-7">
      <h2 className="eyebrow ink">New inquiry</h2>
      <form onSubmit={submit} className="grid gap-4">
        <div>
          <label htmlFor="q-name" className="label">Full name</label>
          <input id="q-name" required value={f.name} onChange={set('name')} className="field" />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label htmlFor="q-greeting" className="label">Greeting</label>
            <input id="q-greeting" value={f.greeting} onChange={set('greeting')} placeholder="First name" className="field" />
          </div>
          <div>
            <label htmlFor="q-home" className="label">Home</label>
            <input id="q-home" value={f.home} onChange={set('home')} placeholder="City" className="field" />
          </div>
        </div>
        <div>
          <label htmlFor="q-email" className="label">Email</label>
          <input id="q-email" type="email" value={f.email} onChange={set('email')} className="field" />
        </div>
        <div>
          <label htmlFor="q-channel" className="label">Came through</label>
          <select id="q-channel" value={f.channel} onChange={set('channel')} className="field">
            {CHANNELS.map((c) => <option key={c}>{c}</option>)}
          </select>
        </div>
        {f.channel !== 'Direct inquiry' && (
          <div>
            <label htmlFor="q-referrer" className="label">Referred by</label>
            <input id="q-referrer" value={f.referrer} onChange={set('referrer')} placeholder={f.channel === 'Referral partner' ? 'Partner clinic or physician' : f.channel} className="field" />
          </div>
        )}
        <p className="text-[13px]/[1.55] text-dim">The greeting and the referrer are separate fields, so a guest with no referrer never needs “(mine)”.</p>
        <button type="submit" className="pill go w-fit" disabled={!f.name.trim()}>Add inquiry</button>
      </form>
    </Panel>
  )
}

type Show = StageId | 'active' | 'exits'

export default function GuestsPage() {
  const guests = useOs((s) => s.guests)
  const [show, setShow] = useState<Show>('active')
  const exits = STAGES.filter((s) => s.exit).map((s) => s.id)
  const rows = guests
    .filter((g) => (show === 'active' ? !exits.includes(g.stage) : show === 'exits' ? exits.includes(g.stage) : g.stage === show))
    .sort((a, b) => STAGES.findIndex((s) => s.id === a.stage) - STAGES.findIndex((s) => s.id === b.stage) || a.since.localeCompare(b.since))
  const filters: { id: Show; word: string; n: number }[] = [
    { id: 'active', word: 'On the journey', n: guests.filter((g) => !exits.includes(g.stage)).length },
    ...ACTIVE_STAGES.map((s) => ({ id: s.id, word: s.word, n: guests.filter((g) => g.stage === s.id).length })),
    { id: 'exits', word: 'Left', n: guests.filter((g) => exits.includes(g.stage)).length },
  ]
  return (
    <div className="arrive grid items-start gap-x-8 gap-y-6" style={{ gridTemplateColumns: 'var(--layout-hub)' }}>
      <ViewHead label={<>Operations · <ExampleNote /></>} title="Guests" lead="One record per guest, from the first inquiry to retention. Stage is a field with a date, so the list reads the same in every view." />
      <section aria-labelledby="list-h" className="grid min-w-0 content-start gap-3.5 @max-[900px]/frame:col-span-full">
        <Sec id="list-h">{filters.find((x) => x.id === show)!.word}</Sec>
        <div role="radiogroup" aria-label="Show guests" className="state-switch w-fit flex-wrap !rounded-[22px]">
          {filters.map((x) => (
            <button key={x.id} type="button" role="radio" aria-checked={show === x.id} onClick={() => setShow(x.id)} className="!px-3 !py-2">
              {x.word} <span className="tabular-nums opacity-70">{x.n}</span>
            </button>
          ))}
        </div>
        <GuestList guests={rows} empty="No guest is at this stage right now. Pick another stage, or add an inquiry." />
      </section>
      <aside className="grid min-w-0 content-start gap-6 @max-[900px]/frame:col-span-full">
        <NewInquiry />
      </aside>
    </div>
  )
}
