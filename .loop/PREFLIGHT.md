# /preflight — 2026-10-24, epic #14

Invoked through the preflight skill in this worktree before /harness or /kickoff. Local implementation is ready; production is outside the authorized scope and remains owner-gated.

| item | needed for (milestone) | status | how verified | fix / exact ask |
|---|---|---|---|---|
| Worktree and branch | M1–M3 | ✅ | pwd resolves supplied Documents path to code symlink; branch lane/iii-Partners-viiibin-template-react-14; clean original tree; lane fast-forwarded to origin/main ff6326b | Commit only here |
| GitHub authenticated access | M1/M3 | ✅ | gh API issue reads and issue comment write succeed using existing keyring; repository grants push | Inherited GH_TOKEN invalid: unset GH_TOKEN/GITHUB_TOKEN per gh command; no credential installation |
| Repository visibility | M1 | ⚠️ | gh repo API reports private=false | Author only generic technical contracts and synthetic fixtures; no customer data or secrets |
| Delivery standard/reference | M1 | ✅ | Read iii-commands standard at 05c6a9b; real GitHub reads of #14, EYE #1230/#1248–#1258, canonical client-kpi schema, app.iii governance sources | References are source review, not production proof |
| Dependency order/dedupe | M1 | ✅ | All template issues and open PRs read; no KPI/GOVENANT children; PR #16 already owns SDK boundary; EYE owns customer administration | Reuse epic #14 and EYE tickets, do not create competing UI/runtime epics |
| Node / npm | M2/M3 | ✅ | Node v26.11.1, npm 11.20.0 | No runtime change |
| Dependencies | M2/M3 | ✅ | npm ci from lock, 741 packages; added pinned @playwright/test 1.64.1 for browser evidence | npm git HTTPS auth stalled; invocation-scoped HTTPS→SSH mapping with existing SSH auth worked. No global config/credentials written |
| Browser | M1/M2 | ✅ | playwright 1.64.1; headless Chromium launch + close succeed | Existing browser cache works |
| Workers / D1 | M2 | ✅ | Wrangler 4.129.1 executes SELECT 1 on isolated local DB under .loop/state/preflight-d1 | No remote DB / credentials needed |
| Existing build + tests | M2/M3 | ✅ | npm run build; 17 tests pass; typecheck:functions passes before implementation | Preserve regressions |
| Existing lint | M3 | ⚠️ | npm run lint RED before product changes: 8 errors, 2 warnings in existing files | Outside #14; owner/maintainer must resolve separately; preserve gate |
| Existing harness ledger | M3 | ⚠️ | known-reds.json is []; unchanged lib requires {repo, entries} | Outside #14; owner/maintainer must repair ledger in separate scope; do not rewrite it here |
| Outbound provider / delivery tests | unrelated #7/#12 | ⚠️ | Variables absent by presence-only inspection; first slice has no outbound sends | No provider calls or Mailosaur claim; not needed for KPI slice |
| Synthetic proof fixtures | M2 | ✅ | Harness will seed isolated per-run D1 from committed synthetic constants; no real discovery/client data required | No fixture represents a customer or revenue |
| Live discovery declarations + approval/read-back | M4 | ⚠️ | Not supplied, base registry deliberately empty | Owner must supply approved discovery declaration and resolvable source in governed project config before activation |
| Real venture binding/auth/D1 | M4 | ⚠️ | Presence-only checks show VENTURE_ID, AUTH0_DOMAIN, API_KEYS, CLOUDFLARE_API_TOKEN absent | Owner configures actual project via existing secret store; never guess or put credentials in issue |
| Agent placement / authority | later children | ⚠️ | U1/U6/U7 remain undetermined in EYE #1257/#1258 | Owner resolves on those tickets before their dependent work |
| Deployment approval | M4 | ⚠️ | User explicitly requires STOP before any deploy | Owner reviews concrete PR and grants deployment approval; this lane stops BLOCKED |

No ❌ input blocks the independent local slice. Preflight is green for that scope; /harness is next. **I could not prove this against the real system.** No deployment or real customer source read-back ran.
