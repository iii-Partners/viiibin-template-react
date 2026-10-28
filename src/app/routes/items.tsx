// Items: a main view. It leads with the items by state (the reel), then the list by state beside the form that adds
// one. Each row opens its item as a screen over the view. A fresh view keeps the same layout: the reel names
// every state at zero, and the list says what an item is and points at the form.
import { useMemo, useState } from 'react'
import { ChevronRight, Database } from 'lucide-react'
import { toast } from 'sonner'
import { useCreateItem } from '@/hooks/use-items'
import { useItemsFor } from '@/hooks/use-items-for'
import { Previewable } from '@/components/system/state-switch'
import { countByState, dateOf, stateOf, wordOf, type ItemState } from '@/lib/items'
import { openScreen } from '@/stores/screens'
import { ReelTrack } from '@/components/system/charts/reel'
import { FolderCard } from '@/components/system/folder-card'
import { Sec, StatusWord } from '@/components/system/status'
import { Blank, Empty, Failed, Pending } from '@/components/system/empty'
import { cn } from '@/lib/utils/cn'

const ST = { active: 'ok', done: 'done' } as const

function AddItem() {
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const create = useCreateItem()
  const submit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!title.trim()) return
    create.mutate(
      { title: title.trim(), description: description.trim() || undefined },
      {
        onSuccess: () => {
          setTitle('')
          setDescription('')
          toast.success('Item added')
        },
        onError: () => toast.error('The item was not added. Check that the API runs, then try again.'),
      },
    )
  }
  return (
    <FolderCard bodyClassName="gap-3">
      <Sec as="h2">Add an item</Sec>
      <form onSubmit={submit} className="grid gap-4">
        <div>
          <label htmlFor="item-title" className="label">Title</label>
          <input id="item-title" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="What is it?" required className="field" />
        </div>
        <div>
          <label htmlFor="item-description" className="label">Description (optional)</label>
          <textarea id="item-description" value={description} onChange={(e) => setDescription(e.target.value)} rows={3} placeholder="What someone needs to know about it" className="field" />
        </div>
        <button type="submit" className="gm-btn go w-fit" disabled={create.isPending || !title.trim()}>
          {create.isPending ? 'Adding…' : 'Add item'}
        </button>
      </form>
    </FolderCard>
  )
}

export default function ItemsPage() {
  // the view reads its data as one part, so its state switch moves the count and the list together
  const { data, isLoading, error, refetch } = useItemsFor('items')
  const [show, setShow] = useState<ItemState | 'all'>('all')
  const items = useMemo(() => data?.items ?? [], [data])
  const counts = countByState(items)
  const rows = show === 'all' ? items : items.filter((i) => stateOf(i) === show)

  return (
    <div className="arrive grid content-start gap-5">
      <div className="grid gap-1">
        <h1 className="text-[40px]/[1.05] font-light tracking-[-0.04em] @max-[700px]/frame:text-[30px]">Items</h1>
        <p className="text-[14.5px] text-dim">The records this app keeps, stored in the D1 database. Open one to see its history and move it on.</p>
      </div>

      <Previewable part="items" label="Items">
      {error ? (
        <Failed
          code="ITM"
          label="Items"
          title="Items did not load"
          detail="The items API did not answer, so no count or list shows. Nothing was lost. In development, run npm run dev:full so the Pages Functions and the D1 database run beside the app."
          onRetry={() => void refetch()}
        />
      ) : (
        <ReelTrack
          code="ITM"
          big={data?.total ?? 0}
          label="Items"
          meta={isLoading ? 'Counting…' : data?.total ? 'By state' : undefined}
          segs={counts.map((c) => ({ label: c.word, n: c.n, st: c.tone }))}
          empty="Items appear here by state once you add the first one."
        />
      )}
      </Previewable>

      <div className="grid items-start gap-x-6 gap-y-5" style={{ gridTemplateColumns: 'var(--layout-hub)' }}>
        <section aria-labelledby="list-h" className="grid min-w-0 content-start gap-3 @max-[900px]/frame:col-span-full">
          <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
            <Sec id="list-h">All items</Sec>
            {/* filter by state; each count stays beside its word */}
            {!error && (
            <div role="radiogroup" aria-label="Show items" className="ml-auto flex flex-wrap gap-1.5">
              {[{ id: 'all' as const, word: 'All', n: items.length }, ...counts.map((c) => ({ id: c.id, word: c.word, n: c.n }))].map((f) => (
                <button
                  key={f.id}
                  type="button"
                  role="radio"
                  aria-checked={show === f.id}
                  onClick={() => setShow(f.id)}
                  className={cn('rounded-chip border px-2.5 py-1.5 text-[12.5px]/none transition-colors duration-(--dur-hover)', show === f.id ? 'border-brand bg-brand text-on-brand' : 'border-line text-dim hover:border-teal hover:text-text')}
                >
                  {f.word} <span className="tabular-nums">{f.n}</span>
                </button>
              ))}
            </div>
            )}
          </div>

          <div className="gm-folder px-2 pb-2 [--fold-pt:6px]">
            {isLoading ? (
              <Pending rows={4} className="px-3 pb-2" />
            ) : error ? (
              <Blank className="m-2">The list shows once the items load. Try again from the notice above.</Blank>
            ) : !items.length ? (
              <Empty icon={Database} title="No items yet" className="m-2 border-none">
                An item is one record: a title, an optional description and a state (active, done or archived). Add the first with the form; it lands here and on the dashboard.
              </Empty>
            ) : !rows.length ? (
              <Blank className="m-2">No item is {wordOf(show as ItemState).toLowerCase()} right now. Pick All to see the rest.</Blank>
            ) : (
              <ul className="m-0 grid list-none p-0">
                {rows.map((item, i) => {
                  const st = stateOf(item)
                  return (
                    <li key={item.id} className="rise-in border-t border-line first:border-t-0" style={{ animationDelay: `${Math.min(i, 8) * 40}ms` }}>
                      <button
                        type="button"
                        data-door={`item-${item.id}`}
                        onClick={(e) => openScreen('item', { id: item.id, part: 'items' }, e.currentTarget)}
                        className="group grid w-full items-center gap-x-4 rounded-tile px-3 py-3 text-left transition-colors duration-(--dur-hover) hover:bg-glass-raised focus-visible:bg-glass-raised focus-visible:outline-none"
                        style={{ gridTemplateColumns: 'var(--layout-row)' }}
                      >
                        <span className="grid min-w-0 gap-0.5">
                          <span className="truncate text-[14.5px] font-medium">{item.title}</span>
                          <span className="truncate text-[12.5px] text-dim">{item.description || `Added ${dateOf(item.created_at)}`}</span>
                        </span>
                        {st === 'archived' ? <span className="text-[12.5px] font-semibold text-dim">{wordOf(st)}</span> : <StatusWord st={ST[st]}>{wordOf(st)}</StatusWord>}
                        <ChevronRight className="h-4 w-4 text-dim transition-transform duration-(--dur-hover) group-hover:translate-x-0.5 group-hover:text-accent" aria-hidden="true" />
                      </button>
                    </li>
                  )
                })}
              </ul>
            )}
          </div>
        </section>
        <aside className="grid min-w-0 content-start gap-5 @max-[900px]/frame:col-span-full">
          <AddItem />
        </aside>
      </div>
    </div>
  )
}
