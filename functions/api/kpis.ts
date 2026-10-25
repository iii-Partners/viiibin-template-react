import { KpiError, readKpis, readKpiObservation, type KpiEnv } from '../_lib/kpis'

const json = (status: number, body: unknown) => Response.json(body, {
  status, headers: { 'cache-control': 'no-store' },
})

/** Protected service read for EYE/instrumentation, never an end-user analytics screen. */
export const onRequestGet: PagesFunction<KpiEnv> = async ({ env, data, request }) => {
  // Only middleware establishes identity; the handler never trusts a client identity header/body.
  if ((data.identity as { kind?: string } | undefined)?.kind !== 'machine')
    return json(403, { error: 'machine_identity_required' })
  // Authentication for business tools does not grant access to operator metrics.
  // Provision EYE's read key explicitly in BOTH allowlists; no default grant.
  const readKeys = (env.KPI_READ_API_KEYS ?? '').split(',').map((s) => s.trim()).filter(Boolean)
  if (!readKeys.length || readKeys.some((key) => !key.startsWith('vk_') || key.length <= 3))
    return json(503, { error: 'kpi_read_identity_not_configured' })
  const authorization = request.headers.get('authorization') ?? ''
  const credential = authorization.startsWith('Bearer ') ? authorization.slice(7).trim() : ''
  if (!readKeys.includes(credential)) return json(403, { error: 'kpi_read_forbidden' })
  const query = new URL(request.url).searchParams
  if ([...query.keys()].some((key) => key !== 'observation_id') || query.getAll('observation_id').length > 1)
    return json(400, { error: 'scope_not_selectable' })
  try {
    if (query.has('observation_id')) {
      const result = await readKpiObservation(env, query.get('observation_id')!)
      return result ? json(200, result) : json(404, { error: 'observation_not_found' })
    }
    return json(200, await readKpis(env))
  } catch (e) {
    // Infrastructure/validation errors must not expose SQL, source values, credentials or an empty-success lie.
    if (e instanceof KpiError) return json(e.message === 'invalid_observation_id' ? 400 : 503, { error: e.message })
    return json(503, { error: 'kpi_storage_unavailable' })
  }
}

export const onRequest: PagesFunction<KpiEnv> = (context) => context.request.method === 'GET'
  ? onRequestGet(context) : json(405, { error: 'method_not_allowed' })
