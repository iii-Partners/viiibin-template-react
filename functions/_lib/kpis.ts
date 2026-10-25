import { z } from 'zod'

// Stored operational references, never payloads, arbitrary URLs/SQL, or personal identifiers.
const determined = (s: string) => s.toLowerCase() !== 'undetermined'
const reference = z.string().regex(/^[a-zA-Z0-9][a-zA-Z0-9_:/.-]{0,199}$/).refine(determined)
const key = z.string().regex(/^[a-z0-9][a-z0-9_]{1,63}$/).refine(determined)
const id = z.string().regex(/^[a-zA-Z0-9][a-zA-Z0-9_-]{0,95}$/).refine(determined)
const venture = z.string().regex(/^[a-z0-9][a-z0-9-]{1,40}$/).refine(determined)
const text = z.string().trim().min(1).max(100).refine(determined)
export const kpiDefinitionSchema = z.strictObject({
  contract: z.literal('kpi-definition/v1'),
  kpi_key: key,
  version: z.number().int().min(1).max(2147483647),
  label: text,
  unit: text,
  category: z.enum(['revenue', 'cost', 'efficiency', 'quality', 'ai_reliability', 'agent_coverage', 'throughput', 'cycle_time', 'other']),
  better_is_lower: z.boolean(),
  discovery_ref: reference,
  approval_ref: reference,
  source_ref: reference,
  max_age_seconds: z.number().int().min(1).max(31536000),
})
const timestamp = z.iso.datetime().transform((s) => new Date(s).toISOString())
export const kpiObservationSchema = z.strictObject({
  observation_id: id,
  kpi_key: key,
  definition_version: z.number().int().min(1).max(2147483647),
  value: z.number().finite().nullable(),
  missing_reason: reference.nullable(),
  source_ref: reference,
  period: z.strictObject({ start: timestamp, end: timestamp }),
}).refine((o) => o.period.start < o.period.end, 'period must be ordered')
  .refine((o) => (o.value === null) === (o.missing_reason !== null), 'null requires a reason; a number has none')

export type KpiDefinition = z.infer<typeof kpiDefinitionSchema>
export type KpiObservation = z.infer<typeof kpiObservationSchema>
export interface KpiEnv { DB?: D1Database; VENTURE_ID?: string }
export class KpiError extends Error {}

function scope(env: KpiEnv) {
  const parsed = venture.safeParse(env.VENTURE_ID)
  if (!parsed.success) throw new KpiError('venture_not_configured')
  if (!env.DB) throw new KpiError('storage_not_configured')
  return { db: env.DB, ventureId: parsed.data }
}

/** Internal delivery helper only. An approval_ref is a reference, not signature verification. */
export async function declareKpi(env: KpiEnv, input: unknown): Promise<KpiDefinition> {
  const parsed = kpiDefinitionSchema.safeParse(input)
  if (!parsed.success) throw new KpiError('invalid_definition')
  const d = parsed.data
  const { db, ventureId } = scope(env)
  try {
    await db.prepare(`INSERT INTO os_kpi_definitions
      (venture_id, kpi_key, version, unit, category, better_is_lower, definition_json)
      SELECT ?, ?, ?, ?, ?, ?, ? WHERE NOT EXISTS (SELECT 1 FROM os_kpi_definitions
        WHERE venture_id = ? AND kpi_key = ? AND version = ?)`)
      .bind(ventureId, d.kpi_key, d.version, d.unit, d.category, Number(d.better_is_lower), JSON.stringify(d),
        ventureId, d.kpi_key, d.version).run()
  } catch (e) {
    if (String(e).includes('definition_meaning_changed')) throw new KpiError('definition_meaning_changed')
    throw e
  }
  const stored = await db.prepare(`SELECT definition_json FROM os_kpi_definitions
    WHERE venture_id = ? AND kpi_key = ? AND version = ?`)
    .bind(ventureId, d.kpi_key, d.version).first<{ definition_json: string }>()
  if (!stored || JSON.stringify(kpiDefinitionSchema.parse(JSON.parse(stored.definition_json))) !== JSON.stringify(d))
    throw new KpiError('definition_conflict')
  return d
}

interface ObservationRow {
  observation_id: string | null
  kpi_key: string
  definition_version: number
  value: number | null
  missing_reason: string | null
  source_ref: string
  period_start: string
  period_end: string
  recorded_at: string
}
interface JoinedRow extends ObservationRow { definition_json: string }

function observationFromRow(row: ObservationRow): KpiObservation {
  return kpiObservationSchema.parse({
    observation_id: row.observation_id, kpi_key: row.kpi_key, definition_version: row.definition_version,
    value: row.value, missing_reason: row.missing_reason, source_ref: row.source_ref,
    period: { start: row.period_start, end: row.period_end },
  })
}

/** Instrument business operations server-side. Never accepts client-selected venture or manual baseline. */
export async function recordKpiObservation(env: KpiEnv, input: unknown): Promise<KpiObservation> {
  const parsed = kpiObservationSchema.safeParse(input)
  if (!parsed.success) throw new KpiError('invalid_observation')
  const o = parsed.data
  const { db, ventureId } = scope(env)
  const definition = await db.prepare(`SELECT version FROM os_kpi_definitions
    WHERE venture_id = ? AND kpi_key = ? AND version = ?`)
    .bind(ventureId, o.kpi_key, o.definition_version).first()
  if (!definition) throw new KpiError('definition_not_found')
  await db.prepare(`INSERT INTO os_kpi_observations
    (venture_id, observation_id, kpi_key, definition_version, value, missing_reason, source_ref, period_start, period_end)
    SELECT ?, ?, ?, ?, ?, ?, ?, ?, ? WHERE NOT EXISTS (SELECT 1 FROM os_kpi_observations
      WHERE venture_id = ? AND observation_id = ?)`)
    .bind(ventureId, o.observation_id, o.kpi_key, o.definition_version, o.value, o.missing_reason,
      o.source_ref, o.period.start, o.period.end, ventureId, o.observation_id).run()
  const stored = await db.prepare('SELECT * FROM os_kpi_observations WHERE venture_id = ? AND observation_id = ?')
    .bind(ventureId, o.observation_id).first<ObservationRow>()
  if (!stored || JSON.stringify(observationFromRow(stored)) !== JSON.stringify(o))
    throw new KpiError('observation_conflict')
  return o
}

function projection(row: JoinedRow, now: Date) {
  const definition = kpiDefinitionSchema.parse(JSON.parse(row.definition_json))
  const observation = row.observation_id === null ? null : observationFromRow(row)
  const state = !observation || observation.value === null ? 'unmeasured'
    : now.getTime() - new Date(observation.period.end).getTime() > definition.max_age_seconds * 1000 ? 'stale' : 'measured'
  return { definition, observation, state, source_verification: 'not_verified' as const,
    recorded_at: observation ? row.recorded_at : null,
    proof_ref: observation ? `/api/kpis?observation_id=${encodeURIComponent(observation.observation_id)}` : null }
}

/** Latest period for the latest definition version, in one indexed query. Empty is not a storage failure. */
export async function readKpis(env: KpiEnv, now = new Date()) {
  const { db, ventureId } = scope(env)
  const { results } = await db.prepare(`SELECT d.definition_json, o.* FROM os_kpi_definitions d
    LEFT JOIN os_kpi_observations o ON o.venture_id = d.venture_id AND o.kpi_key = d.kpi_key
      AND o.definition_version = d.version AND o.observation_id = (
        SELECT observation_id FROM os_kpi_observations latest WHERE latest.venture_id = d.venture_id
          AND latest.kpi_key = d.kpi_key AND latest.definition_version = d.version
        ORDER BY period_end DESC, sequence DESC LIMIT 1)
    WHERE d.venture_id = ? AND d.version = (SELECT MAX(version) FROM os_kpi_definitions versions
      WHERE versions.venture_id = d.venture_id AND versions.kpi_key = d.kpi_key)
    ORDER BY d.kpi_key LIMIT 101`).bind(ventureId).all<JoinedRow>()
  if (results.length > 100) throw new KpiError('kpi_definition_limit_exceeded')
  return { contract: 'business-os-kpis/v1' as const, venture_id: ventureId,
    kpis: results.map((row) => projection(row, now)) }
}

/** One-hop history proof; always includes venture in the WHERE clause. */
export async function readKpiObservation(env: KpiEnv, observationId: string) {
  if (!id.safeParse(observationId).success) throw new KpiError('invalid_observation_id')
  const { db, ventureId } = scope(env)
  const row = await db.prepare(`SELECT d.definition_json, o.* FROM os_kpi_observations o
    JOIN os_kpi_definitions d ON d.venture_id = o.venture_id AND d.kpi_key = o.kpi_key AND d.version = o.definition_version
    WHERE o.venture_id = ? AND o.observation_id = ?`).bind(ventureId, observationId).first<JoinedRow>()
  return row ? { contract: 'business-os-kpi-proof/v1' as const, venture_id: ventureId, ...projection(row, new Date()) } : null
}
