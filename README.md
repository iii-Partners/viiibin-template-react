# {{APP_NAME}}

> Built with [viiibin](https://viiibin.com) -- AI-powered app development

## Quick Start

```bash
npm install
npm run dev
```

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | React 19 + TypeScript |
| Build | Vite 7 |
| Routing | React Router 7 |
| UI Components | ShadCN/ui + Radix UI, on the Fleet Command design system (`design-system/tokens.json`) |
| Styling | Tailwind CSS 4 |
| State | Zustand 5 |
| Forms | React Hook Form + Zod |
| Data Fetching | TanStack Query 5 |
| Auth | Auth0 |
| Mobile | Capacitor 8 (iOS + Android) |
| i18n | react-i18next |
| Testing | Vitest + Testing Library |

## Project Structure

```
src/
├── app/              # App shell, router, providers, route components
│   ├── routes/       # Page components (file-based routing convention)
│   └── providers.tsx # Context providers (Auth0, QueryClient, i18n, etc.)
├── app/screens/      # Child views, opened as layered dialogs (no routes)
├── components/
│   ├── system/       # Design system: folder card, door, status, empty states, confirm, charts
│   ├── shell/        # Wedge-bar header, screen dialog
│   ├── common/       # Shared components (guards, error boundary, loading)
│   ├── layout/       # App shell, public header, footer
│   ├── ui/           # ShadCN primitives (button, card, skeleton)
│   ├── onboarding/   # First-run wizard and checklist
│   ├── payments/     # Pricing cards, subscription status
│   └── gdpr/         # Cookie consent, privacy controls
├── hooks/
│   ├── native/       # Capacitor plugin hooks (camera, geo, biometric, etc.)
│   └── *.ts          # App-level hooks (theme, locale, analytics, PWA)
├── lib/
│   ├── api/          # HTTP client, query keys, offline queue
│   ├── auth/         # Auth0 config, permissions, RBAC
│   ├── analytics/    # Provider abstraction, consent manager
│   ├── i18n/         # i18next setup, locale files
│   ├── payments/     # Stripe config, API stubs
│   ├── storage/      # Secure storage abstraction
│   ├── gdpr/         # Data export, account deletion
│   ├── pwa/          # Service worker registration
│   ├── utils/        # cn(), format, platform detection, a11y helpers
│   └── validation/   # Zod schemas
├── stores/           # Zustand stores (auth, theme, onboarding, etc.)
├── styles/           # Global CSS, Tailwind config
└── types/            # TypeScript type definitions
```

## Configuration

Template variables in `viiibin.config.json`:

| Variable | Description | Default |
|----------|-------------|---------|
| `APP_NAME` | Application name | My App |
| `BUNDLE_ID` | iOS/Android bundle ID | com.example.app |
| `AUTH0_DOMAIN` | Auth0 tenant domain | -- |
| `AUTH0_CLIENT_ID` | Auth0 SPA client ID | -- |
| `API_URL` | Backend API URL | /api |
| `ENABLE_ANALYTICS` | Enable analytics tracking | false |
| `AI_PROVIDER` | AI chat provider | anthropic |
| `AI_MODEL` | AI model name | claude-sonnet-4-5 |
| `PRIMARY_COLOR` | Brand primary color | #6366f1 |
| `STRIPE_PUBLISHABLE_KEY` | Stripe public key | -- |

## Available Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start dev server (Vite) at http://localhost:5182 |
| `npm run tokens` | Write `src/styles/tokens.css` from `design-system/tokens.json` (the dev server does this on start and save) |
| `npm run qa` | Screenshot every view and screen in each data state and theme into `qa-out/` (dev server up) |
| `npm run build` | Production build |
| `npm run preview` | Preview production build |
| `npm run test` | Run Vitest tests |
| `npm run test:delivery` | Delivery proof: real sends awaited at Mailosaur (see Telemetry and delivery proof) |
| `npm run typecheck:functions` | Typecheck the Pages Functions |
| `npm run lint` | Lint with ESLint |
| `npm run format` | Format with Prettier |
| `npm run icons` | Generate app icons from source |
| `npx cap sync` | Sync web assets to native projects |
| `npx cap open ios` | Open Xcode project |
| `npx cap open android` | Open Android Studio project |

## Telemetry and delivery proof

This template is born reporting to the iii Partners fleet and proving its own sends, so every venture spawned from it is too.

**Telemetry (PostHog, one schema).** Events carry the [Fleet Telemetry Standard](https://github.com/iii-Partners/iii-eye/blob/main/docs/standards/TELEMETRY-STANDARD.md): `venture_id`, `pillar`, `actor_type`, `actor_id`, `run_id`, `ticket`, `executor`, `env`, `class`. In the browser, `src/lib/analytics/posthog.ts` registers them as super properties (consent-gated; `VITE_ENABLE_ANALYTICS`, `VITE_POSTHOG_KEY`). In the functions, `functions/_lib/telemetry.ts` wraps `@iii-partners/fleet-kit/telemetry`: `emit(env, 'notification_sent', {...}, context)`, `emitError(env, err, { error_kind }, context)`, `agentProps(model, provider, usage, ms, rate)` for model calls. `GET /api/health` emits a `heartbeat`; the middleware reports uncaught errors as `$exception unhandled_error`. Keys live in the Pages project's variables (`POSTHOG_KEY`, `VENTURE_ID`, `PILLAR`, `APP_ENV`), never in the repo. The kit refuses personal data (emails, names, phone numbers, message bodies, secrets) at the call site.

**Delivery proof (Mailosaur).** `POST /api/notify` sends the welcome email (Resend) and the one-time SMS code (Twilio); `docs/outbound-messages.md` is the inventory. `npm run test:delivery` runs `tests/delivery/*.spec.ts`: the real flow, the real provider, the message awaited at a Mailosaur inbox or number, then recipient, sender, subject, content, links and placeholder text asserted. Needs `MAILOSAUR_API_KEY`, `MAILOSAUR_SERVER_ID`, `MAILOSAUR_PHONE_NUMBER`, `DELIVERY_API_KEY` (a `vk_` key in the server's `API_KEYS`) and the server-side provider variables (`.dev.vars.example`); with `DELIVERY_BASE_URL` set the tests target a deployment, otherwise the global setup starts `wrangler pages dev dist` (build first). CI (`verify.yml`) runs them when the `MAILOSAUR_API_KEY` secret exists and says "not configured" otherwise.

## Business OS foundation

[The fit review and delivery plan](docs/business-os/README.md) describes the KPI and GOVENANT work under [epic #14](https://github.com/iii-Partners/viiibin-template-react/issues/14). The base has no customer KPI defaults or agent executor. EYE owns customer administration, analytics and agent approvals; template routes serve the business's stakeholders.

The first slice adds internal `declareKpi` / `recordKpiObservation` helpers in `functions/_lib/kpis.ts`, additive D1 migration `0001_kpi_spine.sql`, and machine-only `GET /api/kpis` / `?observation_id=<id>`. EYE's read key must be explicitly granted in both `API_KEYS` and server-only `KPI_READ_API_KEYS`; ordinary business keys are refused and a missing read grant returns 503. Never expose this grant through `VITE_*`. The server's `VENTURE_ID` scopes every row. Reads never create measurements. Missing readings stay null, actual zero stays zero, stale readings retain their period, and inaccessible storage returns 503. Definition/observation history forbids update, delete and replacement.

Every response item identifies its external source as `not_verified`. Stored-row proof is available; source re-derivation, EYE export, countersigned baselines and impact deltas belong to later slices. Activate only with owner-approved discovery/configuration, retention and deployment approval; this lane has not deployed it.

To reproduce local proof with synthetic data only: `npm run build`, then `node .loop/harness/kpi-api.mjs`. Run the full gate with `bash .loop/validate.sh`; existing inherited lint/ledger findings remain visible. See `.loop/PREFLIGHT.md` and `.loop/PROGRESS.md` for scope and evidence.

## Design system and navigation

The interface is the navigation, as in a game. Only the main views (Dashboard, Items) have routes; each is a wedge in the header bar. Everything under them opens as a screen: a dialog layered over the view, and closed with Close or Esc. Every view, card, chart and dialog has a designed fresh state, so a new account sees what each place is for before any data exists. Viewers pick the wedge bar or a rail of icons down the side in Settings. `design-system/README.md` holds the rules and the recipes for agents and people building on the template; the Design system screen shows every part in each of its four states (happy path, empty, loading, error).

## Mobile Development

### iOS
```bash
npm run build
npx cap sync ios
npx cap open ios
```

### Android
```bash
npm run build
npx cap sync android
npx cap open android
```

## Features

- **Authentication** -- Auth0 PKCE with AuthGuard, biometric unlock
- **Onboarding** -- First-run wizard with setup checklist
- **i18n** -- Multi-language support (EN, ES) with auto-detection
- **Offline Mode** -- Request queue with auto-retry on reconnect
- **PWA** -- Installable web app with service worker caching
- **Analytics** -- Provider-agnostic tracking with consent management; PostHog on the fleet telemetry schema
- **Delivery proof** -- `POST /api/notify` (email, SMS) with Mailosaur tests that prove each message arrives
- **GDPR** -- Cookie consent, data export, account deletion
- **RBAC** -- Role-based access control (user/admin/owner)
- **Accessibility** -- WCAG 2.1 AA, skip navigation, focus traps
- **Native Plugins** -- Camera, geolocation, haptics, share, push notifications
- **Secure Storage** -- Keychain/Keystore abstraction for sensitive data
- **Payments** -- Stripe checkout and subscription management scaffold
- **Theming** -- Light/dark mode with system preference detection
- **Deep Linking** -- Universal Links (iOS) and App Links (Android)

## License

Private -- generated by viiibin.
