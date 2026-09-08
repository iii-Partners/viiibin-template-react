/// <reference types="@cloudflare/workers-types" />

/**
 * THIS BUSINESS'S OWN MCP SERVICE — same-origin, at `/mcp` on the business's own
 * domain. Priiism builds it; the business owns it. Its customers/partners connect
 * an AI client HERE (never to priiism.ai) to use THIS business's tools, backed by
 * THIS business's D1.
 *
 * Transport: stateless MCP "Streamable HTTP" — each POST is one JSON-RPC 2.0
 * request/response. No timeout concern: Pages Functions are the Workers runtime
 * and these tools are I/O-bound (a D1 query). When this business needs STREAMING /
 * stateful MCP (SSE, sessions, subscriptions, WebSockets), graduate to a companion
 * Worker + Durable Object — the TOOLS array below is transport-agnostic and moves
 * unchanged. Migration runbook: iii-Partners/viiibin#3377.
 */

interface Env {
  DB: D1Database
}

const SERVER = { name: 'Business MCP', version: '1.0.0' }

// Transport-agnostic tool definitions — a future companion Worker imports THESE.
// They are this business's own capabilities, mapped to its own data.
const TOOLS = [
  {
    name: 'list_items',
    description: "List this business's items (newest first).",
    inputSchema: {
      type: 'object',
      properties: { limit: { type: 'number', description: 'Max rows (default 50).' } },
    },
  },
  {
    name: 'create_item',
    description: 'Create an item.',
    inputSchema: {
      type: 'object',
      properties: {
        title: { type: 'string', description: 'Required.' },
        description: { type: 'string' },
      },
      required: ['title'],
    },
  },
  {
    name: 'delete_item',
    description: 'Delete an item by id.',
    inputSchema: {
      type: 'object',
      properties: { id: { type: 'number', description: 'Required.' } },
      required: ['id'],
    },
  },
] as const

async function callTool(env: Env, name: string, args: Record<string, unknown>): Promise<unknown> {
  if (name === 'list_items') {
    const limit = Math.min(Number(args.limit ?? 50) || 50, 200)
    const { results } = await env.DB.prepare(
      'SELECT * FROM items ORDER BY created_at DESC LIMIT ?',
    ).bind(limit).all()
    return { items: results ?? [] }
  }
  if (name === 'create_item') {
    const title = String(args.title ?? '').trim()
    if (!title) throw new Error('title is required')
    const now = new Date().toISOString()
    const item = await env.DB.prepare(
      'INSERT INTO items (title, description, created_at, updated_at) VALUES (?, ?, ?, ?) RETURNING *',
    ).bind(title, (args.description as string | undefined)?.trim() || null, now, now).first()
    return { item }
  }
  if (name === 'delete_item') {
    const id = Number(args.id)
    if (!id) throw new Error('id (number) is required')
    await env.DB.prepare('DELETE FROM items WHERE id = ?').bind(id).run()
    return { deleted: id }
  }
  throw new Error(`Unknown tool: ${name}`)
}

const ok = (id: unknown, result: unknown) => Response.json({ jsonrpc: '2.0', id, result })
const err = (id: unknown, code: number, message: string, status = 200) =>
  Response.json({ jsonrpc: '2.0', id, error: { code, message } }, { status })

// MCP Streamable HTTP: the client POSTs JSON-RPC here.
export const onRequestPost: PagesFunction<Env> = async (context) => {
  let body: { id?: unknown; method?: string; params?: Record<string, unknown> }
  try {
    body = await context.request.json()
  } catch {
    return err(null, -32700, 'Parse error', 400)
  }
  const { id, method, params } = body
  try {
    switch (method) {
      case 'initialize':
        return ok(id, {
          protocolVersion: '2024-11-05',
          capabilities: { tools: {} },
          serverInfo: SERVER,
        })
      case 'notifications/initialized':
        return new Response(null, { status: 202 })
      case 'ping':
        return ok(id, {})
      case 'tools/list':
        return ok(id, { tools: TOOLS })
      case 'tools/call': {
        const out = await callTool(
          context.env,
          String(params?.name ?? ''),
          (params?.arguments as Record<string, unknown>) ?? {},
        )
        return ok(id, { content: [{ type: 'text', text: JSON.stringify(out) }] })
      }
      default:
        return err(id, -32601, `Method not found: ${method}`)
    }
  } catch (e) {
    // Tool errors are returned as a result with isError (MCP convention), not a
    // transport error, so the client can show the message to the user.
    return ok(id, {
      content: [{ type: 'text', text: `Error: ${e instanceof Error ? e.message : 'unknown'}` }],
      isError: true,
    })
  }
}

// A GET returns human/discovery-friendly metadata (not part of the MCP wire).
export const onRequestGet: PagesFunction<Env> = async () =>
  Response.json({
    server: SERVER,
    transport: 'streamable-http',
    endpoint: '/mcp',
    tools: TOOLS.map((t) => t.name),
    note: 'This is this business own MCP service. POST JSON-RPC 2.0 to use it.',
  })
