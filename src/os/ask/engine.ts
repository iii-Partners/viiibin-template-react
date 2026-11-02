// Ask's conversations and the loop that answers them. A question goes to Claude through /api/ask with the history and
// the tool definitions the server holds; when Claude calls tools, the browser runs them against the live state
// (tools.ts), keeps their cards for the answer, and sends the results back, until Claude writes its answer. When the
// endpoint is not reachable (local development, no key, no sign-in), the built-in matcher (local.ts) answers instead,
// and the answer says so. Conversations stay in this browser.
import type Anthropic from '@anthropic-ai/sdk'
import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { api } from '@/lib/api/client'
import { useOs } from '../store'
import type { Block } from './blocks'
import { plan, sentence } from './local'
import { runTool, type Snapshot } from './tools'

export type Part = { tool: string; input: unknown; blocks: Block[] }
export type Engine = 'claude' | 'local'
export interface Turn {
  id: string
  q: string
  at: number
  status: 'working' | 'done' | 'error'
  /** what the answer is doing right now, while it works */
  step?: string
  text?: string
  parts: Part[]
  engine?: Engine
  /** why the built-in matcher answered, when it did */
  why?: string
  error?: string
}
export interface Thread {
  id: string
  title: string
  at: number
  turns: Turn[]
  /** Claude's view of the conversation, appended to and never edited, so its thinking stays valid between turns */
  history: Anthropic.MessageParam[]
}

const STEP_WORD: Record<string, string> = {
  overview: 'Reading the overview', pipeline: 'Counting the journey', find_guests: 'Finding guests', guest_profile: 'Opening the guest record',
  needs: 'Checking what needs a person', retreats: 'Reading the retreat calendar', retreat_detail: 'Opening the retreat', revenue: 'Adding up revenue',
  channels: 'Reading lead sources', medical_reviews: 'Reading the review queue', readiness: 'Checking readiness forms', care: 'Reading integration care',
  staff_workload: 'Weighing workload', activity: 'Reading the activity log', automation_impact: 'Measuring automation', upcoming: 'Laying out what is coming',
  blueprint: 'Reading the discovery documents',
}
export const stepWord = (tool: string) => STEP_WORD[tool] ?? 'Looking it up'

const MAX_ROUNDS = 6
/** Tool results Claude reads are capped, so one wide list can't crowd out the rest of the conversation. */
const MAX_RESULT = 12_000
const uid = () => Math.random().toString(36).slice(2, 10)
const snapshot = (): Snapshot => {
  const { today, guests, retreats, events } = useOs.getState()
  return { today, guests, retreats, events }
}

type AskResponse = { content: Anthropic.ContentBlock[]; stop_reason: string | null }
/** Statuses that mean "this deployment can't answer with Claude", not "this question failed". */
const UNAVAILABLE = new Set([401, 403, 404, 405, 501, 503])

interface AskState {
  threads: Thread[]
  activeId: string | null
  ask(question: string): Promise<void>
  retry(turnId: string): Promise<void>
  open(id: string | null): void
  remove(id: string): void
}

export const useAsk = create<AskState>()(
  persist(
    (set, get) => {
      const patch = (threadId: string, turnId: string, change: Partial<Turn> | ((t: Turn) => Partial<Turn>)) =>
        set((s) => ({
          threads: s.threads.map((th) => (th.id !== threadId ? th : { ...th, turns: th.turns.map((t) => (t.id !== turnId ? t : { ...t, ...(typeof change === 'function' ? change(t) : change) })) })),
        }))
      const setHistory = (threadId: string, history: Anthropic.MessageParam[]) => set((s) => ({ threads: s.threads.map((th) => (th.id === threadId ? { ...th, history } : th)) }))

      /** The built-in matcher: plan, run, and write a sentence per tool. */
      const answerLocally = (threadId: string, turnId: string, q: string, why: string) => {
        const snap = snapshot()
        const calls = plan(snap, q)
        const parts: Part[] = []
        const lines: string[] = []
        for (const c of calls) {
          const out = runTool(snap, c.name, c.input)
          parts.push({ tool: c.name, input: c.input, blocks: out.blocks })
          const line = sentence(c.name, out.data as Record<string, unknown> | null)
          if (line) lines.push(line)
        }
        patch(threadId, turnId, { status: 'done', step: undefined, parts, text: lines.join(' '), engine: 'local', why })
      }

      /** Claude's loop: send, run the tools it asks for, send the results, until it answers. */
      const answerWithClaude = async (threadId: string, turnId: string, q: string) => {
        const th = get().threads.find((x) => x.id === threadId)!
        const messages: Anthropic.MessageParam[] = [...th.history, { role: 'user', content: q }]
        for (let round = 0; round < MAX_ROUNDS; round++) {
          patch(threadId, turnId, (t) => ({ step: t.parts.length ? 'Writing the answer' : 'Reading the question' }))
          const res = await api.post<AskResponse>('/ask', { messages })
          messages.push({ role: 'assistant', content: res.content as Anthropic.ContentBlockParam[] })
          if (res.stop_reason === 'tool_use') {
            const uses = res.content.filter((x): x is Anthropic.ToolUseBlock => x.type === 'tool_use')
            const snap = snapshot()
            const results: Anthropic.ToolResultBlockParam[] = []
            for (const u of uses) {
              patch(threadId, turnId, { step: stepWord(u.name) })
              const out = runTool(snap, u.name, u.input)
              patch(threadId, turnId, (t) => ({ parts: [...t.parts, { tool: u.name, input: u.input, blocks: out.blocks }] }))
              const body = JSON.stringify(out.error ? { error: out.error } : out.data)
              results.push({ type: 'tool_result', tool_use_id: u.id, content: body.length > MAX_RESULT ? `${body.slice(0, MAX_RESULT)}… (cut to fit)` : body, is_error: out.error ? true : undefined })
            }
            // every result for one assistant turn goes back in a single message
            messages.push({ role: 'user', content: results })
            continue
          }
          const text = res.content.filter((x): x is Anthropic.TextBlock => x.type === 'text').map((x) => x.text).join('\n').trim()
          setHistory(threadId, messages)
          if (res.stop_reason === 'refusal') return patch(threadId, turnId, { status: 'done', step: undefined, engine: 'claude', text: text || 'Claude declined to answer this question. Try asking it another way.' })
          return patch(threadId, turnId, { status: 'done', step: undefined, engine: 'claude', text: text || (res.stop_reason === 'max_tokens' ? 'The answer ran past its length limit. The cards above show what was found.' : '') })
        }
        setHistory(threadId, messages)
        patch(threadId, turnId, { status: 'done', step: undefined, engine: 'claude', text: 'This took more lookups than one answer allows. The cards show what was found; ask a narrower question for the rest.' })
      }

      const run = async (threadId: string, turnId: string, q: string) => {
        try {
          await answerWithClaude(threadId, turnId, q)
        } catch (e) {
          const status = (e as { status?: number }).status
          const turn = get().threads.find((x) => x.id === threadId)?.turns.find((t) => t.id === turnId)
          // Nothing shown yet: answer with the matcher, and say why. A failure mid-answer is an error to retry.
          if (!turn?.parts.length) {
            const why =
              status === 503 ? 'Claude is not configured on this deployment (ANTHROPIC_API_KEY).'
              : status === 401 || status === 403 ? 'Sign-in is needed to reach Claude.'
              : status === 429 ? 'Claude is busy right now.'
              : status === undefined || UNAVAILABLE.has(status) || status === 500 ? 'The Ask service is not running here.'
              : 'Claude could not answer this time.'
            return answerLocally(threadId, turnId, q, why)
          }
          patch(threadId, turnId, { status: 'error', step: undefined, error: status === 429 ? 'Claude is busy right now. Try again in a minute.' : 'The answer stopped partway. Try again.' })
        }
      }

      return {
        threads: [],
        activeId: null,
        open: (id) => set({ activeId: id }),
        remove: (id) => set((s) => ({ threads: s.threads.filter((t) => t.id !== id), activeId: s.activeId === id ? null : s.activeId })),
        ask: async (question) => {
          const q = question.trim()
          if (!q) return
          let threadId = get().activeId
          if (!threadId || !get().threads.some((t) => t.id === threadId)) {
            threadId = uid()
            set((s) => ({ activeId: threadId, threads: [{ id: threadId!, title: q.length > 60 ? `${q.slice(0, 57)}…` : q, at: Date.now(), turns: [], history: [] }, ...s.threads] }))
          }
          const turn: Turn = { id: uid(), q, at: Date.now(), status: 'working', step: 'Reading the question', parts: [] }
          set((s) => ({ threads: s.threads.map((th) => (th.id === threadId ? { ...th, at: Date.now(), turns: [...th.turns, turn] } : th)) }))
          await run(threadId, turn.id, q)
        },
        retry: async (turnId) => {
          const th = get().threads.find((x) => x.turns.some((t) => t.id === turnId))
          const t = th?.turns.find((x) => x.id === turnId)
          if (!th || !t) return
          patch(th.id, turnId, { status: 'working', step: 'Reading the question', parts: [], text: undefined, error: undefined })
          await run(th.id, turnId, t.q)
        },
      }
    },
    {
      name: 'northlight-ask',
      version: 1,
      // an answer still working when the page closed can't resume: mark it so it offers a retry
      partialize: (s) => ({ activeId: s.activeId, threads: s.threads.slice(0, 30).map((th) => ({ ...th, turns: th.turns.map((t) => (t.status === 'working' ? { ...t, status: 'error' as const, step: undefined, error: 'The page closed before this answer finished.' } : t)) })) }),
    },
  ),
)
