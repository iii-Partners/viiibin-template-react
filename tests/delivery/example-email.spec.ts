// @vitest-environment node
/**
 * DP-9 (iii-eye#527): the welcome email this app sends really arrives, from this app, with the right subject, a link
 * that resolves, and no placeholder text. The flow is the real one: POST /api/notify through the auth middleware, Resend
 * delivers, Mailosaur receives. Nothing is stubbed; a provider that is not configured is a loud 503, not a skip.
 */
import { describe, it, expect } from 'vitest'
import { generateEmail, waitForEmail, assertRecipient, assertSender, assertSubject, assertContains, assertNoPlaceholders, assertLinksResolve } from '@iii-partners/fleet-kit/delivery-proof'
import { baseUrl, apiHeaders, appName, fromDomain, recordRun, configured, explainSkip } from './lib'

if (!configured.mailosaur) explainSkip('MAILOSAUR_API_KEY / MAILOSAUR_SERVER_ID missing')

describe.skipIf(!configured.mailosaur)('delivery: the welcome email', () => {
  it('arrives at a fresh inbox with the right subject, a working link and no placeholder', async () => {
    const to = generateEmail('welcome')
    const sentAt = new Date(Date.now() - 1000)
    const r = await fetch(`${baseUrl()}/api/notify`, { method: 'POST', headers: apiHeaders(), body: JSON.stringify({ channel: 'email', to, template: 'welcome' }) })
    const j = (await r.json()) as { ok?: boolean; run_id?: string; provider?: string; error?: string; note?: string; missing?: string }
    expect(r.status, `POST /api/notify answered ${r.status}: ${JSON.stringify(j)}`).toBe(202)
    expect(j.run_id).toMatch(/^notify-\d{14}-/)
    recordRun('email', j.run_id!, { provider: j.provider })

    const msg = await waitForEmail(to, { timeoutMs: 120_000, receivedAfter: sentAt })
    assertRecipient(msg, to)
    const domain = fromDomain()
    if (domain) assertSender(msg, { domain })
    assertSubject(msg, `Welcome to ${appName()}`)
    assertContains(msg, 'Your account is ready')
    assertNoPlaceholders(msg)
    const links = await assertLinksResolve(msg, { timeoutMs: 15_000, concurrency: 2 })
    expect(links.length, 'the welcome email carries at least one link, and every link resolved').toBeGreaterThan(0)
  })
})
