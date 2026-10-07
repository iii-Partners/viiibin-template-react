// @vitest-environment node
/**
 * DP-9 (iii-eye#527): the one-time code this app sends by SMS really arrives at the Mailosaur number, names the app,
 * carries a six-digit code, and has no placeholder text. Real flow: POST /api/notify → Twilio → Mailosaur. A deployment
 * without Twilio configured answers 503 naming the variable, and this test fails with that name instead of skipping.
 */
import { describe, it, expect } from 'vitest'
import { waitForSms, assertNoPlaceholders, assertContains, extractCode } from '@iii-partners/fleet-kit/delivery-proof'
import { baseUrl, apiHeaders, appName, recordRun, configured, explainSkip } from './lib'

if (!configured.sms) explainSkip('MAILOSAUR_API_KEY / MAILOSAUR_SERVER_ID / MAILOSAUR_PHONE_NUMBER missing')

describe.skipIf(!configured.sms)('delivery: the SMS code', () => {
  it('arrives at the Mailosaur number with a six-digit code and no placeholder', async () => {
    const phone = process.env.MAILOSAUR_PHONE_NUMBER!
    const sentAt = new Date(Date.now() - 1000)
    const r = await fetch(`${baseUrl()}/api/notify`, { method: 'POST', headers: apiHeaders(), body: JSON.stringify({ channel: 'sms', to: phone, template: 'code' }) })
    const j = (await r.json()) as { ok?: boolean; run_id?: string; provider?: string; error?: string; note?: string; missing?: string }
    expect(r.status, `POST /api/notify answered ${r.status}: ${JSON.stringify(j)}`).toBe(202)
    expect(j.run_id).toMatch(/^notify-\d{14}-/)
    recordRun('sms', j.run_id!, { provider: j.provider })

    const msg = await waitForSms(phone, { timeoutMs: 120_000, receivedAfter: sentAt })
    assertContains(msg, appName())
    assertNoPlaceholders(msg)
    const code = extractCode(msg, { length: 6 })
    expect(code, `no six-digit code in the SMS: ${msg.bodyText}`).toMatch(/^\d{6}$/)
  })
})
