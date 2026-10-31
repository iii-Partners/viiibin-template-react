// Status is one component everywhere: word, shape and color together. Blocked is a coral triangle, what needs you a
// mustard diamond, at risk a terracotta square, on track a sea-green square, done an ocean-blue disc, paused (and
// archived) a hollow gray square. A color never stands without its word.
import type { ReactNode } from 'react'
import { cn } from '@/lib/utils/cn'

export type Status = 'blocked' | 'pending' | 'risk' | 'ok' | 'paused' | 'done'

export const STATUS_WORD: Record<Status, string> = {
  blocked: 'Blocked',
  pending: 'Needs you',
  risk: 'At risk',
  ok: 'On track',
  paused: 'Paused',
  done: 'Done',
}

export const STATUS_VAR: Record<Status, string> = {
  blocked: 'var(--fault)',
  pending: 'var(--need)',
  risk: 'var(--watch)',
  ok: 'var(--ok)',
  paused: 'var(--paused)',
  done: 'var(--done)',
}

/** The most urgent of several statuses: blocked, then a decision, then at risk, on track, paused, then done. */
export function worst(sts: Status[]): Status {
  const order: Status[] = ['blocked', 'pending', 'risk', 'ok', 'paused', 'done']
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

/** A section head: the tracked label in ink, with a hairline running out to the right. */
export function Sec({ as: Tag = 'h2', id, children, className }: { as?: 'h2' | 'h3'; id?: string; children: ReactNode; className?: string }) {
  return (
    <Tag id={id} className={cn('sec', className)}>
      {children}
    </Tag>
  )
}
