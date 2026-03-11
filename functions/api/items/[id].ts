interface Env {
  DB: D1Database
}

// GET /api/items/:id — get a single item
export const onRequestGet: PagesFunction<Env> = async (context) => {
  const id = context.params.id
  const item = await context.env.DB.prepare(
    'SELECT * FROM items WHERE id = ?'
  ).bind(id).first()

  if (!item) {
    return Response.json({ error: 'Not found' }, { status: 404 })
  }

  return Response.json({ item })
}

// PATCH /api/items/:id — update an item
export const onRequestPatch: PagesFunction<Env> = async (context) => {
  const id = context.params.id
  const body = await context.request.json() as {
    title?: string
    description?: string
    status?: string
  }

  const existing = await context.env.DB.prepare(
    'SELECT * FROM items WHERE id = ?'
  ).bind(id).first()

  if (!existing) {
    return Response.json({ error: 'Not found' }, { status: 404 })
  }

  const now = new Date().toISOString()
  const result = await context.env.DB.prepare(
    'UPDATE items SET title = ?, description = ?, status = ?, updated_at = ? WHERE id = ? RETURNING *'
  ).bind(
    body.title?.trim() ?? existing.title,
    body.description?.trim() ?? existing.description,
    body.status ?? existing.status,
    now,
    id
  ).first()

  return Response.json({ item: result })
}

// DELETE /api/items/:id — delete an item
export const onRequestDelete: PagesFunction<Env> = async (context) => {
  const id = context.params.id

  const existing = await context.env.DB.prepare(
    'SELECT * FROM items WHERE id = ?'
  ).bind(id).first()

  if (!existing) {
    return Response.json({ error: 'Not found' }, { status: 404 })
  }

  await context.env.DB.prepare('DELETE FROM items WHERE id = ?').bind(id).run()

  return Response.json({ success: true })
}
