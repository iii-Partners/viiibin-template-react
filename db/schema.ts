import { sqliteTable, text, integer } from 'drizzle-orm/sqlite-core'

// Example schema — customize for your app
export const items = sqliteTable('items', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  title: text('title').notNull(),
  description: text('description'),
  status: text('status').notNull().default('active'),
  createdAt: text('created_at').notNull().$defaultFn(() => new Date().toISOString()),
  updatedAt: text('updated_at').notNull().$defaultFn(() => new Date().toISOString()),
})

export type Item = typeof items.$inferSelect
export type NewItem = typeof items.$inferInsert
