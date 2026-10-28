# The design system

This template ships a working design system, so an agent building an app from it can produce finished screens without
designing anything. The system came from Fleet Command (iii.partners) on October 28, 2026. Read this file before you build
a view, a screen or a part.

Two places show you everything:

- **The catalog** (`src/design/catalog.tsx`) lists every part with its import, when to use it, and how it renders in its
  four states. Read it in code.
- **The Design system screen** (the palette door on the dashboard, or the palette in the rail) renders the catalog. Each
  part has a switch for its four states, and one switch at the top sets them all.

## The rules

1. **Navigation is the interface.** Whatever the nav reaches is a view, with a route; whatever opens from inside a view
   is a screen, a dialog layered over it. With the wedge bar, the nav reaches the main views (`MAIN_VIEWS` in
   `src/app/nav.ts`). With the rail, it also reaches the bird's-eye view, the design system, the profile and settings
   (`RAIL_VIEWS`), so those are views too; with the wedge bar they open as screens. Open any of them with
   `useOpenPlace()` (`src/app/open-place.ts`), which picks the right form. A screen opened from a screen layers over it.
   Never add a route for a record or a form opened from a view.
2. **Every place has four states.** A view, card, chart, list or dialog shows the happy path, an empty state, a loading
   state and an error state. The empty state says what will appear and offers the first step. The loading state keeps
   the part's shape. The error state says what failed and offers a retry.
3. **Every panel is a folder card.** Use `FolderCard`, or the class `.gm-folder` on an element that scrolls or clips.
   ShadCN's `Card` already renders one.
4. **Status is a word, a shape and a color together.** Use `StatusWord` or `Chip`. On track is green, at risk amber,
   blocked red, a decision purple, done blue. Never show a status color without its word.
5. **Purple is the one accent.** It marks the open view, the primary action and what waits on the viewer.
6. **Type stays quiet.** Headings are no heavier than medium, in sentence case. Large numbers use Rajdhani
   (`font-figure`).
7. **Light is the default.** Dark applies only when the viewer picks it.
8. **Motion moves only transform and opacity,** and settles at once under reduced motion.
9. **Close carries an Esc tag; nothing else shows a key.** Esc closes the top layer only. A confirm has no Close: its
   Cancel answers no.
10. **Copy is US English, plain and active.** Keep proper nouns and acronyms in their case.

## The parts

Import every part from one place: `import { FolderCard, ReelTrack, Empty } from '@/components/system'`.

| Need | Part |
|---|---|
| A count cut by status, to lead a view | `ReelTrack` |
| Work through counted stages, or a funnel | `StageChart` |
| A whole and its parts | `Fan` |
| Steps, or a plan on a calendar | `Chain`, `Timeline` |
| Each stage as a share of the one before | `Handoffs` |
| Readings against a target | `Bars` |
| One share against a plan | `Ring` |
| Four readings on one instrument | `Dial` (readings from `src/lib/dial-readings.ts`) |
| A way into a screen | `Door` |
| A panel | `FolderCard` |
| What waits on the viewer | `FolderCard` with `StatusWord`, and `GrowButton` for its context |
| A place with no data | `Empty` (card-sized) or `Blank` (in-line) |
| Data on its way | `PendingCard` (card-sized) or `Pending` (rows) |
| Data that did not come | `Failed` |
| A yes-or-no question | `confirm({ title, body, action, risky })` |
| A form field | `.label` and `.field`; `.gm-btn go` for the primary action |

Layout lockups live in `design-system/tokens.json` under `layout` and are read as `var(--layout-<name>)`:
`layout-hub` (the work and a right column), `layout-doors`, `layout-plates` and `layout-row`.

## States in the live UI

Each main view's lead chart carries a state switch (Happy, Empty, Loading, Error, Live). While the switches are on
(Settings, Prototype; on by default in development), every view opens on its Happy path with example data from
`src/lib/sample-items.ts`. The switch moves the whole view, so its counts, doors, lists and needs agree. A view reads
its data through `useItemsFor(part)` (`src/hooks/use-items-for.ts`), which returns the query's shape, so each state
renders through the view's own code. Wrap the lead chart in `Previewable` to show the switch. Example data has nothing
to write to, so a record opened from it turns its actions off.

An error state is designed, not an alarm: the part keeps its frame, `Failed` draws a broken track where its reading
would be, and nothing that was not read shows as zero or empty.

## Recipes

**Add a main view.** Add it to `MAIN_VIEWS` in `src/app/nav.ts` and as a route in `src/app/router.tsx`, importing it
directly so it shows at once. Lead it with a chart (usually `ReelTrack`), then its list and actions. Give it all four
states.

**Add a screen** (a record, a form, a detail). Add its id to `ScreenId` in `src/stores/screens.ts`. Add its head and
body to `SCREENS` in `src/app/screens/index.tsx`. Open it from a door or a row with
`openScreen(id, params, event.currentTarget)`. The screen dialog gives it the blur, the Close cue, Esc, focus return and
layering.

**Add a part.** Build it in `src/components/system`, export it from `src/components/system/index.ts`, and add it to the
catalog with all four states. `npm test` renders every catalog part in every state and fails if one is missing.

**Point the dial at the app's own data.** Change `src/lib/dial-readings.ts` alone. Each ring takes a share, a mix, a
count out of a whole, or a run of days.

**Pick the nav style.** The wedge bar (the default) or the rail. Viewers choose in Settings. To change the default, set
`navStyle` in `src/stores/preferences.ts`. To put another place on the rail, add it to `RAIL_VIEWS` in
`src/app/nav.ts`, give it a route with `RailView` in `src/app/router.tsx`, and a button in
`src/components/shell/rail.tsx`.

**Change a color, radius or font.** Edit `design-system/tokens.json`. The dev server writes `src/styles/tokens.css` from
it; never edit that file by hand.

## Check your work

- `npm test` checks every catalog part in every state, the layers and the dial's readings.
- `npm run qa`, with the dev server up, takes screenshots of every view and screen in the fresh, partial and failed data
  states, in both themes, at 1440 and 390 px, into `qa-out/`. Read them after any visual change. Check that text fits,
  nothing clips, and every status color sits beside its word.
