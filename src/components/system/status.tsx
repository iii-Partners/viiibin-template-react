// Status is one component everywhere: word, shape and color together. Blocked is a red triangle, a decision a purple
// diamond, at risk an amber square, on track a green square, done a blue disc. A color never stands without its word.
import type { ReactNode } from 'react'
import { cn } from '@/lib/utils/cn'

export type Status = 'blocked' | 'pending' | 'risk' | 'ok' | 'done'

export const STATUS_WORD: Record<Status, string> = {
  blocked: 'Blocked',
  pending: 'Needs you',
  risk: 'At risk',
  ok: 'On track',
  done: 'Done',
}

export const STATUS_VAR: Record<Status, string> = {
  blocked: 'var(--fault)',
  pending: 'var(--brand)',
  risk: 'var(--watch)',
  ok: 'var(--ok)',
  done: 'var(--done)',
}

/** The most urgent of several statuses: blocked, then a decision, then at risk, then on track, then done. */
export function worst(sts: Status[]): Status {
  const order: Status[] = ['blocked', 'pending', 'risk', 'ok', 'done']
  return order.find((s) => sts.includes(s)) ?? 'ok'
}

export function StatusWord({ st, children, className }: { st: Status; children?: ReactNode; className?: string }) {
  return <span className={cn('st', st, className)}>{children ?? STATUS_WORD[st]}</span>
}

/** The shape alone, for places where the word sits beside it already. */
export function StatusShape({ st, className }: { st: Status; className?: string }) {
  return <i className={cn('s', st, className)} aria-hidden="true" />
}

export function Chip({ st, children }: { st: Status; children?: ReactNode }) {
  return <span className={cn('chip', st)}>{children ?? STATUS_WORD[st]}</span>
}

/** A section head with the purple tick. */
export function Sec({ as: Tag = 'h2', id, children, className }: { as?: 'h2' | 'h3'; id?: string; children: ReactNode; className?: string }) {
  return (
    <Tag id={id} className={cn('sec', className)}>
      {children}
    </Tag>
  )
}
