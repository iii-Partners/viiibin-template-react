# Outbound messages — what this app sends, and how each send is proven

Every message this app sends to a person is listed here, and each row has a delivery test in `tests/delivery/` that
triggers the real flow, waits for the message to arrive at a Mailosaur inbox or number, and asserts recipient, sender,
subject, content, working links and no placeholder text (`@iii-partners/fleet-kit/delivery-proof`; DP-9, iii-eye#527).
A new send path means a new row and a new test, or the inventory check in the fleet harness goes red.

| # | Message | Channel | Provider | Trigger | Template | Test |
|---|---|---|---|---|---|---|
| OUT-1 | Welcome email | email | Resend (`RESEND_API_KEY`, from `NOTIFY_FROM`) | `POST /api/notify {channel:"email", template:"welcome"}` | `functions/api/notify.ts` `welcomeEmail()` | `tests/delivery/example-email.spec.ts` |
| OUT-2 | One-time code | sms | Twilio (`TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN`, from `TWILIO_FROM`) | `POST /api/notify {channel:"sms", template:"code"}` | `functions/api/notify.ts` `sendSms()` | `tests/delivery/example-sms.spec.ts` |

Sent by third parties on this app's behalf, not provable here: Auth0's own emails (verification, password reset) when
authentication is enabled — they come from the Auth0 tenant's email provider, not from this code.

Rules: Mailosaur is for testing our own sending only, never an identity for any account. Recipients never enter a
telemetry event; the `notification_sent` event carries channel, template, provider and the run id, nothing else.
