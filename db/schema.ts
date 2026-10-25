import { sqliteTable, text, integer, real, primaryKey, foreignKey, index, check, unique } from 'drizzle-orm/sqlite-core'
import { sql } from 'drizzle-orm'

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

// OS-K1 history. Immutability/meaning triggers live in 0001_kpi_spine.sql;
// generated schema changes must retain those triggers. No destructive rollback.
export const kpiDefinitions = sqliteTable('os_kpi_definitions', {
  ventureId: text('venture_id').notNull(),
  kpiKey: text('kpi_key').notNull(),
  version: integer('version').notNull(),
  unit: text('unit').notNull(),
  category: text('category').notNull(),
  betterIsLower: integer('better_is_lower', { mode: 'boolean' }).notNull(),
  definitionJson: text('definition_json').notNull(),
}, (t) => [
  primaryKey({ columns: [t.ventureId, t.kpiKey, t.version] }),
  check('os_kpi_version_positive', sql`${t.version} > 0`),
  check('os_kpi_unit_nonempty', sql`length(${t.unit}) > 0`),
  check('os_kpi_direction_boolean', sql`${t.betterIsLower} IN (0, 1)`),
  check('os_kpi_definition_consistent', sql`json_valid(${t.definitionJson})
    AND json_extract(${t.definitionJson}, '$.contract') IS 'kpi-definition/v1'
    AND json_extract(${t.definitionJson}, '$.kpi_key') IS ${t.kpiKey}
    AND json_extract(${t.definitionJson}, '$.version') IS ${t.version}
    AND json_extract(${t.definitionJson}, '$.unit') IS ${t.unit}
    AND json_extract(${t.definitionJson}, '$.category') IS ${t.category}
    AND json_extract(${t.definitionJson}, '$.better_is_lower') IS ${t.betterIsLower}`),
])

export const kpiObservations = sqliteTable('os_kpi_observations', {
  sequence: integer('sequence').primaryKey({ autoIncrement: true }),
  ventureId: text('venture_id').notNull(),
  observationId: text('observation_id').notNull(),
  kpiKey: text('kpi_key').notNull(),
  definitionVersion: integer('definition_version').notNull(),
  value: real('value'),
  missingReason: text('missing_reason'),
  sourceRef: text('source_ref').notNull(),
  periodStart: text('period_start').notNull(),
  periodEnd: text('period_end').notNull(),
  recordedAt: text('recorded_at').notNull().default(sql`(strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))`),
}, (t) => [
  unique('os_kpi_observation_identity').on(t.ventureId, t.observationId),
  foreignKey({ columns: [t.ventureId, t.kpiKey, t.definitionVersion],
    foreignColumns: [kpiDefinitions.ventureId, kpiDefinitions.kpiKey, kpiDefinitions.version] }),
  index('os_kpi_latest').on(t.ventureId, t.kpiKey, t.definitionVersion, sql`${t.periodEnd} DESC`, sql`${t.sequence} DESC`),
  check('os_kpi_period_ordered', sql`${t.periodEnd} > ${t.periodStart}`),
  check('os_kpi_source_nonempty', sql`length(${t.sourceRef}) > 0`),
  check('os_kpi_missingness', sql`(${t.value} IS NULL AND ${t.missingReason} IS NOT NULL AND length(${t.missingReason}) > 0)
    OR (${t.value} IS NOT NULL AND ${t.missingReason} IS NULL)`),
])
