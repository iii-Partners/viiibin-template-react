// Guests: every guest by stage, one record each (insight I02). The list filters by stage; a row opens the guest's
// record as a screen. The form on the right adds an inquiry with the channel, the referrer and the greeting as three
// fields, where today the referrer's name doubles as the text greeting (insight I01).
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { cn } from '@/lib/utils/cn'
import { useState } from 'react'
import { toast } from 'sonner'
import { openScreen } from '@/stores/screens'
import { Panel } from '@/components/system/panel'
import { Sec } from '@/components/system/status'
import { ACTIVE_STAGES, STAGES, type Channel, type StageId } from '@/os/model'
import { useOs } from '@/os/store'
import { ACTOR, ExampleNote, GuestList, ViewHead } from '@/os/ui'

const CHANNELS: Channel[] = ['Direct inquiry', 'Referral partner', 'Salesperson', 'Elan']
/** Enough to catch a typo before the record is made: something, an @, a domain with a dot. */
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

function NewInquiry() {
  const addInquiry = useOs((s) => s.addInquiry)
  const [f, setF] = useState({ name: '', greeting: '', email: '', home: '', channel: 'Referral partner' as Channel, referrer: '' })
  const set = (k: keyof typeof f) => (e: React.ChangeEvent<HTMLInputElement>) => setF({ ...f, [k]: e.target.value })
  const badEmail = f.email.trim() !== '' && !EMAIL.test(f.email.trim())
  const submit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!f.name.trim() || badEmail) return
    const id = addInquiry({ ...f, name: f.name.trim(), greeting: f.greeting.trim() || f.name.trim().split(' ')[0], referrer: f.referrer.trim() || undefined }, ACTOR.operations)
    toast.success(`${f.name.trim()} added as an inquiry`)
    setF({ ...f, name: '', greeting: '', email: '', home: '', referrer: '' })
    openScreen('guest', { id })
  }
  return (
    <Panel band className="gap-5 !p-7">
      <h2 className="eyebrow ink">New inquiry</h2>
      <form onSubmit={submit} noValidate className="grid gap-4">
        <div>
          <Label htmlFor="q-name">Full name</Label>
          <Input id="q-name" required value={f.name} onChange={set('name')} />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label htmlFor="q-greeting">Greeting</Label>
            <Input id="q-greeting" value={f.greeting} onChange={set('greeting')} placeholder="First name" />
          </div>
          <div>
            <Label htmlFor="q-home">Home</Label>
            <Input id="q-home" value={f.home} onChange={set('home')} placeholder="City" />
          </div>
        </div>
        <div>
          <Label htmlFor="q-email">Email</Label>
          <Input id="q-email" type="email" value={f.email} onChange={set('email')} aria-invalid={badEmail} aria-describedby={badEmail ? 'q-email-error' : undefined} className={cn(badEmail && '!border-fault')} />
          {badEmail && <p id="q-email-error" className="mt-1.5 text-[13px] text-fault">Check the email address; it needs an @ and a domain.</p>}
        </div>
        <div>
          <Label htmlFor="q-channel">Came through</Label>
          <Select value={f.channel} onValueChange={(v) => setF({ ...f, channel: v as Channel })}>
            <SelectTrigger id="q-channel"><SelectValue /></SelectTrigger>
            <SelectContent>{CHANNELS.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
          </Select>
        </div>
        {f.channel !== 'Direct inquiry' && (
          <div>
            <Label htmlFor="q-referrer">Referred by</Label>
            <Input id="q-referrer" value={f.referrer} onChange={set('referrer')} placeholder={f.channel === 'Referral partner' ? 'Partner clinic or physician' : f.channel} />
          </div>
        )}
        <p className="text-[13px]/[1.55] text-dim">The greeting and the referrer are separate fields, so a guest with no referrer never needs “(mine)”.</p>
        <button type="submit" className="pill go w-fit" disabled={!f.name.trim() || badEmail}>Add inquiry</button>
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
