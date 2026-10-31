// A door: the way into a screen, drawn as a live panel. Its name in Newsreader over its status word, then the count
// as a Newsreader figure with an arrow under the icon, when there is a count, and the icon in a hairline circle.
// Pointing at it darkens its edge and moves the arrow; pressing it opens its screen over the view. A door with nothing behind it yet still opens: its word says
// what to do first.
import { ArrowRight, type LucideIcon } from 'lucide-react'
import { Panel } from './panel'
import { StatusWord, type Status } from './status'

/** `st` is the door's status; leave it out when the word is a plain note (a figure's label), not a status. */
export function Door({ id, name, st, word, n, icon: Icon, onOpen, className }: { id: string; name: string; st?: Status; word: string; n?: number; icon: LucideIcon; onOpen(el: HTMLElement): void; className?: string }) {
  return (
    <Panel
      as="button"
      type="button"
      live
      data-door={id}
      onClick={(e: React.MouseEvent<HTMLButtonElement>) => onOpen(e.currentTarget)}
      className={`grid-cols-[minmax(0,1fr)_auto] items-start gap-x-3 gap-y-4 !p-5 ${className ?? ''}`}
    >
      <span className="grid min-w-0 gap-1.5">
        <span className="font-display leading-[1.15] font-light break-words" style={{ fontSize: 'calc(22px * var(--display-scale))' }}>{name}</span>
        {st ? <StatusWord st={st} className="!whitespace-normal">{word}</StatusWord> : <span className="text-[13px]/[1.35] text-dim">{word}</span>}
      </span>
      <span className="grid h-10 w-10 place-items-center rounded-full border border-edge text-text" aria-hidden="true">
        <Icon size={17} strokeWidth={1.5} />
      </span>
      {n != null && (
        <>
          <span className="figure text-[44px]/none">{n}</span>
          <ArrowRight size={18} strokeWidth={1.4} className="arr self-end justify-self-center text-dim" aria-hidden="true" />
        </>
      )}
    </Panel>
  )
}
