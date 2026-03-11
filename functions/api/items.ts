interface Env {
  DB: D1Database
}

// GET /api/items — list all items
export const onRequestGet: PagesFunction<Env> = async (context) => {
  const url = new URL(context.request.url)
  const limit = Math.min(Number(url.searchParams.get('limit') || '25'), 100)
  const offset = Number(url.searchParams.get('offset') || '0')

  const countRow = await context.env.DB.prepare(
    'SELECT COUNT(*) as total FROM items'
  ).first<{ total: number }>()

  const { results } = await context.env.DB.prepare(
    'SELECT * FROM items ORDER BY created_at DESC LIMIT ? OFFSET ?'
  ).bind(limit, offset).all()

  return Response.json({
    items: results ?? [],
    total: countRow?.total ?? 0,
    limit,
    offset,
  })
}

// POST /api/items — create a new item
export const onRequestPost: PagesFunction<Env> = async (context) => {
  const body = await context.request.json() as { title: string; description?: string }

  if (!body.title?.trim()) {
    return Response.json({ error: 'Title is required' }, { status: 400 })
  }

  const now = new Date().toISOString()
  const result = await context.env.DB.prepare(
    'INSERT INTO items (title, description, created_at, updated_at) VALUES (?, ?, ?, ?) RETURNING *'
  ).bind(body.title.trim(), body.description?.trim() || null, now, now).first()

  return Response.json({ item: result }, { status: 201 })
}
