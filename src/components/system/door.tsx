// A door: the way into a screen, drawn as a folder card. The name in semibold over its status word, then the count in
// Rajdhani (two digits) beside a Lucide icon in its status color. Pointing at it raises the inner glow; pressing it
// opens its screen over the view. A door with nothing behind it yet still opens: its word says what to do first.
import type { LucideIcon } from 'lucide-react'
import { FolderCard } from './folder-card'
import { STATUS_VAR, StatusWord, type Status } from './status'

export function Door({ id, name, st, word, n, icon: Icon, onOpen, className }: { id: string; name: string; st: Status; word: string; n?: number; icon: LucideIcon; onOpen(el: HTMLElement): void; className?: string }) {
  return (
    <FolderCard
      as="button"
      type="button"
      glow
      data-door={id}
      onClick={(e: React.MouseEvent<HTMLButtonElement>) => onOpen(e.currentTarget)}
      className={className}
      bodyClassName="grid-cols-[minmax(0,1fr)_auto_auto] items-center gap-x-3 !pb-4"
    >
      <span className="grid min-w-0 gap-0.5">
        <span className="truncate text-[17px]/[1.25] font-semibold tracking-[-0.01em]">{name}</span>
        <StatusWord st={st} className="!text-[13px] !whitespace-normal">{word}</StatusWord>
      </span>
      {n != null && <span className="font-figure text-[40px]/none font-medium tabular-nums">{String(n).padStart(2, '0')}</span>}
      <span style={{ color: STATUS_VAR[st] }}>
        <Icon size={30} strokeWidth={2} aria-hidden="true" />
      </span>
    </FolderCard>
  )
}
