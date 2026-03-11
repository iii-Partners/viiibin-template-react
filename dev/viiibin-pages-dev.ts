/**
 * Vite plugin that emulates Cloudflare Pages Functions in development.
 *
 * When running inside a viiibin sandbox, the Vite dev server doesn't have
 * Cloudflare Workers bindings (D1, KV, etc.). This plugin intercepts /api/*
 * requests, loads the matching Pages Function from functions/, and provides
 * a D1 database shim that proxies queries through viiibin's D1 proxy API.
 *
 * Config is read from .env.viiibin (written by the Modal bridge at session start).
 */
import fs from 'node:fs'
import path from 'node:path'
import type { Plugin, ViteDevServer } from 'vite'

// ---------------------------------------------------------------------------
// D1 Proxy Config
// ---------------------------------------------------------------------------

interface D1ProxyConfig {
  apiUrl: string
  projectId: string
  mcpToken: string
}

let cachedConfig: D1ProxyConfig | null | undefined

function loadConfig(): D1ProxyConfig | null {
  if (cachedConfig !== undefined) return cachedConfig

  let apiUrl = process.env.VIIIBIN_API_URL
  let projectId = process.env.VIIIBIN_PROJECT_ID
  let mcpToken = process.env.VIIIBIN_MCP_TOKEN

  // Fall back to .env.viiibin file (written by Modal bridge)
  if (!apiUrl || !projectId || !mcpToken) {
    const envPath = path.resolve('.env.viiibin')
    if (fs.existsSync(envPath)) {
      for (const line of fs.readFileSync(envPath, 'utf8').split('\n')) {
        const eq = line.indexOf('=')
        if (eq === -1) continue
        const key = line.slice(0, eq)
        const value = line.slice(eq + 1)
        if (key === 'VIIIBIN_API_URL') apiUrl = value
        if (key === 'VIIIBIN_PROJECT_ID') projectId = value
        if (key === 'VIIIBIN_MCP_TOKEN') mcpToken = value
      }
    }
  }

  cachedConfig = apiUrl && projectId && mcpToken ? { apiUrl, projectId, mcpToken } : null
  return cachedConfig
}

// ---------------------------------------------------------------------------
// D1 Database Shim — proxies prepare/bind/all/first/run to viiibin D1 API
// ---------------------------------------------------------------------------

class D1PreparedStatement {
  private params: unknown[] = []

  constructor(
    private config: D1ProxyConfig,
    private sql: string,
  ) {}

  bind(...values: unknown[]) {
    this.params = values
    return this
  }

  async all<T = Record<string, unknown>>(): Promise<{
    results: T[]
    success: boolean
    meta?: unknown
  }> {
    const res = await fetch(
      `${this.config.apiUrl}/api/mcp/projects/${this.config.projectId}/database/query`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${this.config.mcpToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ sql: this.sql, params: this.params }),
      },
    )
    if (!res.ok) {
      const text = await res.text()
      throw new Error(`D1 proxy error (${res.status}): ${text}`)
    }
    const data = (await res.json()) as { results?: T[]; success: boolean; meta?: unknown }
    return { results: data.results || [], success: data.success, meta: data.meta }
  }

  async first<T = Record<string, unknown>>(col?: string): Promise<T | null> {
    const { results } = await this.all<T>()
    if (!results.length) return null
    if (col) return (results[0] as Record<string, unknown>)[col] as T
    return results[0]
  }

  async run() {
    const { success, meta } = await this.all()
    return { success, meta }
  }
}

class D1DatabaseProxy {
  constructor(private config: D1ProxyConfig) {}

  prepare(sql: string) {
    return new D1PreparedStatement(this.config, sql)
  }

  async exec(sql: string) {
    return new D1PreparedStatement(this.config, sql).run()
  }

  async batch(statements: D1PreparedStatement[]) {
    return Promise.all(statements.map((s) => s.all()))
  }
}

// ---------------------------------------------------------------------------
// Vite Plugin
// ---------------------------------------------------------------------------

export function viiiibinPagesDev(): Plugin {
  let server: ViteDevServer

  return {
    name: 'viiibin-pages-dev',

    configureServer(srv) {
      server = srv

      // Middleware runs BEFORE Vite's built-in proxy so we intercept /api/* first
      srv.middlewares.use(async (req, res, next) => {
        const url = req.url
        if (!url || !url.startsWith('/api/')) return next()

        // Lazy-load config (file may not exist yet at server start)
        const config = loadConfig()
        if (!config) return next()

        // Map URL to functions/ file
        const urlPath = url.split('?')[0]
        const functionsDir = path.resolve('functions')
        const candidates = [
          path.join(functionsDir, urlPath + '.ts'),
          path.join(functionsDir, urlPath + '.js'),
          path.join(functionsDir, urlPath, 'index.ts'),
          path.join(functionsDir, urlPath, 'index.js'),
        ]

        const functionPath = candidates.find((p) => fs.existsSync(p))
        if (!functionPath) return next()

        try {
          const mod = await server.ssrLoadModule(functionPath)

          const method = (req.method || 'GET').toUpperCase()
          const handlerName = `onRequest${method.charAt(0) + method.slice(1).toLowerCase()}`
          const handler = mod[handlerName] || mod.onRequest
          if (!handler) {
            res.statusCode = 405
            res.end(JSON.stringify({ error: `No handler for ${method}` }))
            return
          }

          // Collect request body
          const bodyChunks: Buffer[] = []
          for await (const chunk of req) bodyChunks.push(chunk as Buffer)
          const bodyStr = Buffer.concat(bodyChunks).toString()

          // Build a Web API Request
          const fullUrl = `http://${req.headers.host}${url}`
          const headers: Record<string, string> = {}
          for (const [k, v] of Object.entries(req.headers)) {
            if (v !== undefined) headers[k] = Array.isArray(v) ? v.join(', ') : v
          }

          const request = new Request(fullUrl, {
            method,
            headers,
            body: ['GET', 'HEAD'].includes(method) ? undefined : bodyStr || undefined,
          })

          // Create a CF Pages Function-compatible context
          const context = {
            request,
            env: { DB: new D1DatabaseProxy(config) },
            params: {},
            waitUntil: () => {},
            passThroughOnException: () => {},
            next: () => new Response('Not found', { status: 404 }),
            data: {},
          }

          const response: Response = await handler(context)

          // Write response back to Node's ServerResponse
          res.statusCode = response.status
          response.headers.forEach((value, key) => {
            res.setHeader(key, value)
          })
          const responseBody = await response.arrayBuffer()
          res.end(Buffer.from(responseBody))
        } catch (err) {
          console.error('[viiibin] Pages Function error:', err)
          res.statusCode = 500
          res.end(JSON.stringify({ error: 'Internal server error', message: String(err) }))
        }
      })
    },
  }
}
