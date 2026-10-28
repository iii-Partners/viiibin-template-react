// An item as a screen: opened from its row on the Items view. It leads with where the item is
// in its life (a track: created, active, done, archived), then its record and its actions. Delete asks first, in a
// confirm layered over this screen; once deleted, the screen closes itself.
import { useState } from 'react'
import { toast } from 'sonner'
import { FileQuestion } from 'lucide-react'
import { useDeleteItem, useUpdateItem } from '@/hooks/use-items'
import { useItemsFor } from '@/hooks/use-items-for'
import { ITEM_STATES, dateOf, stateOf, wordOf, type ItemState } from '@/lib/items'
import { Chain, type Tone } from '@/components/system/charts/track'
import { FolderCard } from '@/components/system/folder-card'
import { Sec } from '@/components/system/status'
import { Empty, Failed, Pending } from '@/components/system/empty'
import { confirm } from '@/components/system/confirm'
import { useScreens } from '@/stores/screens'
import type { ScreenHead } from '@/components/shell/screen-dialog'

/** The item's head, read from the part that opened it (its view's preview, or live). */
export function useItemHead(id: number, part = 'live'): ScreenHead {
  const { data } = useItemsFor(part)
  const item = data?.items.find((i) => i.id === id)
  if (!item) return { kind: 'Item', title: data ? 'Item not found' : 'Item' }
  const st = stateOf(item)
  return { kind: `Item · #${item.id}`, title: item.title, st: st === 'done' ? 'done' : st === 'active' ? 'ok' : undefined, word: wordOf(st) }
}

export function ItemScreen({ id, screenKey, part = 'live' }: { id: number; screenKey: string; part?: string }) {
  const { data, isLoading, error, refetch, preview } = useItemsFor(part)
  // example data (a preview) has nothing to write to: its actions stay off
  const example = preview !== 'live'
  const update = useUpdateItem()
  const remove = useDeleteItem()
  const [busy, setBusy] = useState(false)
  const item = data?.items.find((i) => i.id === id)

  if (isLoading) return <Pending rows={4} />
  if (error) return <Failed title="The item did not load" detail={(error as { message?: string }).message ?? 'The items API did not answer.'} onRetry={() => void refetch()} />
  if (!item)
    return (
      <Empty icon={FileQuestion} title="This item is no longer here">
        Someone deleted it, or it never reached the database. Close this screen to go back to the list.
      </Empty>
    )

  const st = stateOf(item)
  const at = ITEM_STATES.findIndex((s) => s.id === st)
  const steps: { title: string; sub?: string; tone?: Tone }[] = [
    { title: 'Created', sub: dateOf(item.created_at), tone: 'done' },
    ...ITEM_STATES.map((s, i) => ({ title: s.word, sub: i === at ? dateOf(item.updated_at) : undefined, tone: (i < at ? 'done' : i === at ? 'lit' : '') as Tone })),
  ]

  const move = (to: ItemState) =>
    update.mutate({ id: item.id, status: to }, { onSuccess: () => toast.success(`Marked ${wordOf(to).toLowerCase()}`), onError: () => toast.error('The change did not save. Try again.') })

  const del = async () => {
    const yes = await confirm({ title: `Delete “${item.title}”?`, body: 'The item and its history leave the database. This cannot be undone.', action: 'Delete', risky: true })
    if (!yes) return
    setBusy(true)
    remove.mutate(item.id, {
      onSuccess: () => {
        toast.success('Item deleted')
        useScreens.getState().close(screenKey)
      },
      onError: () => {
        toast.error('The item was not deleted. Try again.')
        setBusy(false)
      },
    })
  }

  return (
    <>
      <FolderCard bodyClassName="gap-2">
        <code className="font-mono text-[11px]/none font-medium tracking-[0.04em] text-brand">[LIFE]</code>
        <Chain label="Where the item is in its life" steps={steps} />
      </FolderCard>
      <div className="grid gap-3.5" style={{ gridTemplateColumns: 'var(--layout-plates)' }}>
        <FolderCard bodyClassName="gap-3">
          <Sec as="h3">Record</Sec>
          <p className="text-[15px]/[1.55]">{item.description || <span className="text-dim">No description yet. Add one when the item needs more than its title.</span>}</p>
          <dl className="grid grid-cols-[auto_minmax(0,1fr)] gap-x-4 gap-y-1.5 border-t border-line pt-3 text-[13px]">
            <dt className="text-dim">Created</dt>
            <dd className="text-right tabular-nums">{dateOf(item.created_at)}</dd>
            <dt className="text-dim">Last changed</dt>
            <dd className="text-right tabular-nums">{dateOf(item.updated_at)}</dd>
            <dt className="text-dim">ID</dt>
            <dd className="text-right font-mono tabular-nums">#{item.id}</dd>
          </dl>
        </FolderCard>
        <FolderCard bodyClassName="gap-3">
          <Sec as="h3">Move it on</Sec>
          <p className="text-[13.5px]/[1.5] text-dim">
            {example ? 'This is example data, so moving it on is off. Switch the view to Live to work with real items.' : 'Each state is a step on the track above. Moving an item back is always allowed.'}
          </p>
          <div className="flex flex-wrap gap-2">
            {ITEM_STATES.filter((s) => s.id !== st).map((s) => (
              <button key={s.id} type="button" className="gm-btn" disabled={example || update.isPending} onClick={() => move(s.id)}>
                Mark {s.word.toLowerCase()}
              </button>
            ))}
          </div>
          <div className="mt-1 border-t border-line pt-3">
            <button type="button" className="btn !border-fault/60 !text-fault hover:!border-fault" disabled={example || busy} onClick={() => void del()}>
              Delete item
            </button>
          </div>
        </FolderCard>
      </div>
    </>
  )
}
