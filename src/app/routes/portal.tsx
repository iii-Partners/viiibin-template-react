// The guest portal: the guest's own view of the same record, shown in a phone frame. Pick a guest to see what they see
// at their stage: the one thing to do next (submit the application, sign, pay, return a form), their retreat, and the
// preparation and after-care timeline with real dates. What a guest does here moves the operations and clinical views.
// A prospect can also start an inquiry themselves, the direct path today's process lacks (insight I01).
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useState } from 'react'
import { toast } from 'sonner'
import { Check, Headphones, Leaf } from 'lucide-react'
import { Panel } from '@/components/system/panel'
import { Sec, StatusWord } from '@/components/system/status'
import { cn } from '@/lib/utils/cn'
import { ACTIVE_STAGES, addDays, fmt, FORMS, PROGRAMS, retreatName, RETREAT_WINDOW, STAGE, type Guest, type Retreat } from '@/os/model'
import { useOs } from '@/os/store'
import { ExampleNote, ViewHead } from '@/os/ui'

const money = (n: number) => n.toLocaleString('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 })

/** The guest's next step, in their words, with the action that does it. */
function NextStep({ g, r }: { g: Guest; r?: Retreat }) {
  const os = useOs()
  const box = (title: string, body: string, action?: { label: string; run(): void }) => (
    <div className="grid gap-3 bg-band p-5">
      <span className="eyebrow ink">Your next step</span>
      <b className="font-display text-[24px]/[1.2] font-light">{title}</b>
      <p className="text-[14px]/[1.6] text-dim">{body}</p>
      {action && <button type="button" className="pill go w-fit" onClick={action.run}>{action.label}</button>}
    </div>
  )
  switch (g.stage) {
    case 'inquiry': return box('We’ve received your inquiry', 'Someone from our team will call you within two working days to talk through the programs.')
    case 'application': return box('Complete your Program Application', `It takes about 20 minutes. Our Medical Team reviews it before anything is booked.${g.hold ? ` We’re holding a room for you until ${fmt(g.hold.expires)}.` : ''}`, { label: 'Submit application', run: () => os.submitApplication(g.id) })
    case 'review':
      return g.medical.status === 'info'
        ? box('Our Medical Team has a question', 'They need a little more information before they can decide. Answer in your portal; it goes straight to them.', { label: 'Send the information', run: () => os.provideInfo(g.id) })
        : box('Your application is with our Medical Team', `They usually decide within two working days. Submitted ${fmt(g.medical.submitted!)}.`)
    case 'agreement':
      if (!g.agreement.signed) return box('Sign your consulting agreement', 'Your agreement and invoice arrived together. Sign first; you can pay right after.', { label: 'Sign agreement', run: () => os.signAgreement(g.id) })
      return box(`Pay invoice ${g.invoice?.number}`, `${money(g.invoice?.amount ?? 0)} for your ${g.program ? PROGRAMS[g.program].word.toLowerCase() : 'program'}. Paying confirms your room${r ? ` on ${fmt(r.start)}` : ''}.`, { label: 'Pay now', run: () => os.payInvoice(g.id) })
    case 'preparing': {
      const next = FORMS.find((f) => g.forms[f.id] && !g.forms[f.id]!.done)
      return next
        ? box(next.word, `Due ${fmt(g.forms[next.id]!.due)}. ${FORMS.filter((f) => g.forms[f.id]?.done).length} of ${FORMS.length} preparation steps are done.`, { label: 'Complete it', run: () => os.completeForm(g.id, next.id) })
        : box('You’re ready', `Everything is in. The day before you arrive we’ll text you to introduce your hosts and arrange your pick-up.`)
    }
    case 'retreat': return box('Welcome', `You’re in room ${g.room}. Your facilitator will brief you on what comes before and after each session.`)
    case 'integration': return box('Integration', g.care.checkIn ? `${g.integrator ?? 'Your Integration Guide'} checked in on ${fmt(g.care.checkIn)}. Your next calls are on your calendar.` : `${g.integrator ?? 'Your Integration Guide'} will check in ${g.care.checkInDue ? `on ${fmt(g.care.checkInDue)}` : 'within 48 hours'}.`)
    case 'retention': return box('How are you doing?', `Silas will call you around ${fmt(g.retention!.callDue)} to hear how you’re doing and talk about what’s next.`)
    default: return box('Thank you', g.stage === 'not-approved' ? 'Our Medical Team wrote to you about their decision. Reply to that letter with any questions.' : 'Your record stays with us. Reach out whenever you’d like to return.')
  }
}

/** The preparation and after-care timeline, in dates: the comms timeline as the guest lives it. */
function Timeline({ g, r }: { g: Guest; r: Retreat }) {
  const today = useOs((s) => s.today)
  const first = !g.returning
  const rows = [
    { at: addDays(r.start, -60), text: 'Preparing for your Experience: your Prep Guide by email and text' },
    { at: addDays(r.start, -42), text: 'Medical Substance form' },
    { at: addDays(r.start, -14), text: 'Travel details' },
    { at: addDays(r.start, -7), text: 'IV consent form' },
    { at: addDays(r.start, -1), text: 'A text introducing your hosts, and your pick-up' },
    { at: r.start, text: `${retreatName(r)} begins` },
    { at: r.end, text: 'Elan’s Integration Audio' },
    { at: addDays(r.end, 2), text: 'Check-in with your Integration Guide, and a feedback email' },
    { at: addDays(r.end, 3), text: 'Retreat follow-up and resources' },
    { at: addDays(r.end, 4), text: 'A short post-visit review' },
    ...(first ? [{ at: addDays(r.end, ((8 - new Date(`${r.end}T12:00:00Z`).getUTCDay()) % 7) || 7), text: 'Living Well Series begins: one email a week for eight weeks' }] : []),
  ]
  return (
    <ol className="m-0 grid list-none p-0">
      {rows.map((x) => {
        const past = x.at <= today
        return (
          <li key={x.text} className="grid grid-cols-[64px_14px_minmax(0,1fr)] items-start gap-x-3 pb-3.5">
            <span className={cn('pt-px text-right text-[12px] tabular-nums', past ? 'text-dim' : 'text-text')}>{fmt(x.at)}</span>
            <span className={cn('mt-1 h-2.5 w-2.5 rounded-full border', past ? 'border-text bg-text' : 'border-edge')} aria-hidden="true" />
            <span className={cn('text-[13.5px]/[1.45]', past && 'text-dim')}>{x.text}</span>
          </li>
        )
      })}
    </ol>
  )
}

function Phone({ g }: { g: Guest }) {
  const retreats = useOs((s) => s.retreats)
  const r = retreats.find((x) => x.id === (g.retreatId ?? g.hold?.retreatId))
  const path = ACTIVE_STAGES.slice(0, 7)
  const at = path.findIndex((s) => s.id === g.stage)
  return (
    <div className="mx-auto w-full max-w-[400px] rounded-[44px] border border-edge/60 bg-ground p-2.5 shadow-float">
      <div className="grid max-h-[760px] gap-5 overflow-y-auto rounded-[36px] border border-line bg-panel px-5 pt-7 pb-8">
        <div className="flex items-center justify-between">
          <span className="font-display text-[18px]">Northlight</span>
          <Leaf size={16} strokeWidth={1.5} aria-hidden="true" />
        </div>
        <div className="grid gap-1">
          <span className="eyebrow">{STAGE[g.stage].word}</span>
          <h2 className="text-[34px]/[1.05]">Hello, <em>{g.greeting}</em></h2>
        </div>
        <NextStep g={g} r={r} />
        {at >= 0 && (
          <div className="grid gap-2" aria-label={`Step ${at + 1} of ${path.length}: ${path[at].word}`}>
            <span className="flex gap-1" aria-hidden="true">{path.map((s, i) => <i key={s.id} className={cn('block h-1 flex-1', i <= at ? 'bg-text' : 'bg-wash')} />)}</span>
            <span className="text-[12.5px] text-dim">Step {at + 1} of {path.length} · {path[at].word}{path[at + 1] ? `, then ${path[at + 1].word.toLowerCase()}` : ''}</span>
          </div>
        )}
        {r && (
          <div className="grid gap-2 border-t border-line pt-4">
            <span className="eyebrow">{g.retreatId ? 'Your retreat' : 'Held for you'}</span>
            <b className="font-display text-[21px]/[1.2] font-light">{fmt(r.start, { month: 'long', day: 'numeric' })} to {fmt(r.end, { month: 'long', day: 'numeric' })}</b>
            <span className="text-[13px] text-dim">{retreatName(r)} · {RETREAT_WINDOW[r.version]}{g.room ? ` · room ${g.room}` : ''}</span>
            {g.integrator && <span className="text-[13px] text-dim">Integration Guide: {g.integrator}</span>}
          </div>
        )}
        {g.stage === 'preparing' && (
          <div className="grid gap-2 border-t border-line pt-4">
            <span className="eyebrow">Preparation</span>
            {FORMS.map((f) => {
              const x = g.forms[f.id]
              return (
                <span key={f.id} className="flex items-center justify-between gap-3 text-[13.5px]">
                  <span className="flex items-center gap-2">
                    <span className={cn('grid h-4 w-4 place-items-center rounded-full border', x?.done ? 'border-text bg-text text-ground' : 'border-edge')} aria-hidden="true">{x?.done && <Check size={10} strokeWidth={2.5} />}</span>
                    {f.word}
                  </span>
                  <span className="text-[12px] text-dim">{x?.done ? 'Done' : x ? `Due ${fmt(x.due)}` : ''}</span>
                </span>
              )
            })}
          </div>
        )}
        {(g.stage === 'integration' || g.stage === 'retention') && (
          <div className="grid gap-3 border-t border-line pt-4">
            <span className="flex items-center gap-2.5"><Headphones size={15} strokeWidth={1.5} aria-hidden="true" /><span className="eyebrow ink">Elan’s Integration Audio</span></span>
            {g.les && <StatusWord st="ok">{g.les.status === 'scheduled' ? `Living Well Series starts ${fmt(g.les.start)}` : g.les.status === 'completed' ? 'Living Well Series complete' : `Living Well Series · week ${g.les.week} of 8`}</StatusWord>}
          </div>
        )}
        {r && ['agreement', 'preparing', 'retreat', 'integration'].includes(g.stage) && (
          <div className="grid gap-3 border-t border-line pt-4">
            <span className="eyebrow">What happens when</span>
            <Timeline g={g} r={r} />
          </div>
        )}
      </div>
    </div>
  )
}

function StartInquiry() {
  const addInquiry = useOs((s) => s.addInquiry)
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const badEmail = email.trim() !== '' && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())
  const submit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim() || badEmail) return
    addInquiry({ name: name.trim(), greeting: name.trim().split(' ')[0], email, home: '', channel: 'Direct inquiry' }, name.trim())
    toast.success('Inquiry sent. It is on the Guests view and in Needs you for sales.')
    setName('')
    setEmail('')
  }
  return (
    <Panel className="gap-4">
      <Sec as="h2">A prospect starts here</Sec>
      <p className="text-[14px]/[1.6] text-dim">Today every lead reaches admin through Elan or a salesperson. Here a prospect or a referral partner sends an inquiry themselves.</p>
      <form onSubmit={submit} noValidate className="grid gap-4">
        <div>
          <Label htmlFor="p-name">Your name</Label>
          <Input id="p-name" value={name} onChange={(e) => setName(e.target.value)} required />
        </div>
        <div>
          <Label htmlFor="p-email">Email</Label>
          <Input id="p-email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} aria-invalid={badEmail} aria-describedby={badEmail ? 'p-email-error' : undefined} className={cn(badEmail && '!border-fault')} />
          {badEmail && <p id="p-email-error" className="mt-1.5 text-[13px] text-fault">Check the email address; it needs an @ and a domain.</p>}
        </div>
        <button type="submit" className="pill go w-fit" disabled={!name.trim() || badEmail}>Send inquiry</button>
      </form>
    </Panel>
  )
}

export default function PortalPage() {
  const guests = useOs((s) => s.guests)
  const [id, setId] = useState('g09')
  const g = guests.find((x) => x.id === id) ?? guests[0]
  return (
    <div className="arrive grid items-start gap-x-10 gap-y-6 grid-cols-[minmax(0,1fr)_minmax(320px,420px)] @max-[900px]/frame:grid-cols-1">
      <ViewHead label={<>The guest · <ExampleNote /></>} title="Guest portal" lead="What a guest sees and does at each stage. A guest’s action here moves the same record operations and the Medical Team work from." />
      <div className="grid min-w-0 content-start gap-6">
        <Panel band className="gap-4 !p-7">
          <Label htmlFor="as" className="eyebrow ink !mb-0">Viewing as</Label>
          <Select value={g.id} onValueChange={setId}>
            <SelectTrigger id="as"><SelectValue /></SelectTrigger>
            <SelectContent>{guests.map((x) => <SelectItem key={x.id} value={x.id}>{x.name} · {STAGE[x.stage].word}</SelectItem>)}</SelectContent>
          </Select>
          <p className="text-[14px]/[1.6] text-dim">Try Ava Lindqvist: pay her invoice and her room is confirmed, her readiness checklist appears, and she moves to Preparing on the Guests view. Or Priya Nair: her application waits in Medical reviews.</p>
        </Panel>
        <StartInquiry />
      </div>
      <Phone g={g} />
    </div>
  )
}
