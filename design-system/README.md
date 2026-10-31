# The design system

This template ships a working design system, so an agent building an app from it can produce finished screens without
designing anything. This branch (`design/modern`) carries the Modern system, which we built on October 30, 2026 from
a reference proposal deck (`~/wellcrafted-artifacts/skills/proposal-deck`). It replaces Fleet Command's look (purple accent,
folder cards, wedge bar) and keeps everything underneath it: the views, the screens, the four states and the catalog.
Read this file before you build a view, a screen or a part.

Two places show you everything:

- **The catalog** (`src/design/catalog.tsx`) lists every part with its import, when to use it, and how it renders in its
  four states. Read it in code.
- **The Design system screen** (the palette on the rail) renders the catalog and the design variants.
  Each part has a switch for its four states, and one switch at the top sets them all.

## What the system looks like

The deck reads as calm and expensive, and it gets that from restraint. The app keeps the same restraint:

- **One ink.** Nearly everything is a deep-ocean blue (`#1f4558`) on warm cream (`#f7f3ec`). At night the two swap
  roles: sea-foam ink on a deep-ocean ground. Status colors are the only other hues, and each one appears only beside
  its word.
- **Newsreader light for anything you read as a heading or a number.** View titles, panel titles, door names, list
  rows and every figure use Newsreader at weight 300. Body text, labels and controls use DM Sans.
- **Tracked labels.** Section heads, the label over a reading, nav words and button text are small capitals with wide
  letter spacing (0.14em). Write them in sentence case in the source; CSS sets the capitals.
- **Square things hold content; round things you press.** Panels, tiles, fields, tags and chart tracks are square.
  Buttons are pills, icon buttons are circles, and the rail and the state switch are capsules.
- **Glass only for what floats.** The rail and dialogs are frosted. Panels on the ground are flat, with
  a hairline edge and no shadow.
- **Slow, soft fades.** A view's parts fade up 8 px over 700 ms, 80 ms apart. A dialog's veil fades in over 500 ms
  while its sheet rises 12 px. Hover changes take 250 ms.

## The rules

1. **Navigation is the interface.** Whatever the nav reaches is a view, with a route; whatever opens from inside a view
   is a screen, a dialog layered over it. The rail is the only nav for now: it reaches the main views, grouped by
   audience (`MAIN_VIEWS` and `VIEW_GROUPS` in `src/app/nav.ts`), and the design system, the profile and settings
   (`RAIL_VIEWS`), so those are views too. The header pill stays in `src/components/shell/header.tsx` for later. Open any of them with
   `useOpenPlace()` (`src/app/open-place.ts`), which picks the right form. A screen opened from a screen layers over it.
   Never add a route for a record or a form opened from a view.
2. **Every place has four states.** A view, card, chart, list or dialog shows the happy path, an empty state, a loading
   state and an error state. The empty state says what will appear and offers the first step. The loading state keeps
   the part's shape. The error state says what failed and offers a retry.
3. **Every card is a panel.** Use `Panel`, or the class `.panel` on an element that cannot take the component. Pass
   `live` for a panel the viewer presses, and `band` for the view's one lead surface (Continue, Start here, the form
   that adds a record). A view has at most one band. ShadCN's `Card` already renders a panel.
4. **Status is a word, a shape and a color together.** Use `StatusWord` or `Chip`. On track is a sea-green square, at
   risk a terracotta square, blocked a coral triangle, needs you a mustard diamond, paused a hollow gray square, done
   an ocean-blue disc. Never show a status color without its word.
5. **The ink is the accent.** A solid ink pill marks the primary action and the open view; there is one primary action
   per panel. Mustard marks only what waits on the viewer (the Needs you diamond and the rail's count badge). Ocean
   blue is the hover color and the Done color. Lagoon is the focus ring.
6. **Type stays light.** Headings and figures are Newsreader 300, never bold; one italic word is the only emphasis a
   heading takes. Figures set `.figure` (lining, tabular numerals).
7. **Light is the default.** Dark applies only when the viewer picks it.
8. **Motion moves only transform and opacity,** and settles at once under reduced motion. Nothing loops except the
   breathing of a part while it loads.
9. **Close carries an Esc tag; nothing else shows a key.** Esc closes the top layer only. A confirm has no Close: its
   Cancel answers no.
10. **Copy is US English, plain and active.** Keep proper nouns and acronyms in their case.

## The parts

Import every part from one place: `import { Panel, ReelTrack, Empty } from '@/components/system'`.

| Need | Part |
|---|---|
| A count cut by status, to lead a view | `ReelTrack` |
| Work through counted stages, or a funnel | `StageChart` |
| A whole and its parts | `Fan` |
| Steps, or a plan on a calendar | `Chain`, `Timeline` |
| Each stage as a share of the one before | `Handoffs` |
| Readings against a target | `Bars` |
| One share against a plan | `Ring` |
| A way into a screen | `Door` |
| A panel | `Panel` (`live` to press, `band` for the lead surface) |
| What waits on the viewer | `Panel` with `StatusWord`, and `GrowButton` for its context |
| A place with no data | `Empty` (card-sized) or `Blank` (in-line) |
| Data on its way | `PendingCard` (card-sized) or `Pending` (rows) |
| Data that did not come | `Failed` |
| A yes-or-no question | `confirm({ title, body, action, risky })` |
| A form field | `.label` and `.field` |
| A button | `.pill` (`.go` primary, `.risky` destructive, `.sm` compact); `.round` for an icon; `.explore` for a link with an arrow |
| A section head, or the label over a reading | `Sec`, or `.eyebrow` (`.eyebrow.ink` for ink) |
| A number | `.figure` |

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
directly so it shows at once. Open it with a tracked label, a Newsreader title (`type-display`) and one `lead` sentence that says what the
view shows right now. Lead the work with a chart (usually `ReelTrack`), then its list and actions. Give it all four
states.

**Add a screen** (a record, a form, a detail). Add its id to `ScreenId` in `src/stores/screens.ts`. Add its head and
body to `SCREENS` in `src/app/screens/index.tsx`. Open it from a door or a row with
`openScreen(id, params, event.currentTarget)`. The screen dialog gives it the blur, the Close cue, Esc, focus return and
layering.

**Add a part.** Build it in `src/components/system`, export it from `src/components/system/index.ts`, and add it to the
catalog with all four states. `npm test` renders every catalog part in every state and fails if one is missing.

**Put a place on the rail.** A main view goes in `MAIN_VIEWS` with its group; the rail draws the groups in
`VIEW_GROUPS` order with a hairline between them. Any other place goes in `RAIL_VIEWS` in `src/app/nav.ts`, with a
route through `RailView` in `src/app/router.tsx` and a button in `src/components/shell/rail.tsx`. To bring back the
header pill, let `navStyle` be `'bar'` again in `src/stores/preferences.ts` (its migration forces the rail today).

**The Northlight variant and its ambient light.** Northlight is the default variant for now (`src/stores/variant.ts`). It
builds on Solage's type (Newsreader and tracked Jost) with layers of soft white: glass panels (`panel-opacity`,
`panel-shadow`), a dawn wash over the ground (`ground-image`), a white rail, and a sun-gradient hairline on the primary
action and the open view (`go-fill`, `rail-on-bg`). It sets `glow-on: 1` and nine `glow-*` colors sampled from the
Northlight logo, which turns on the ambient light (`src/components/shell/ambient.tsx`): the reference deck's edge-wave shader,
softened to melt into the ground and set beneath every element, breathing slowly and swelling whenever the OS records
an event, and the deck's cursor wisp as a faint aura behind the
glass. Settings, Appearance has the switch; reduced motion stills the glow and turns the aura off.

**Add or change a design variant.** Variants live in `design-system/tokens.json` under `variants.list`: colors for light
and dark (any token may be overridden; the rest come from the base), font families (`display`, `body`, `figure`,
`label`, `lead`), the shape variables under `shape` (button and panel radius, label tracking, heading case, style and
scale) and motion timings, and `fonts`, the Google Fonts query loaded the first time the variant is picked. The token
writer emits `<html data-variant="…">` rules and `[data-variant-scope="…"]` rules (one element, as in the gallery), and
`src/design/variants.json` for the picker. `npm test` fails if any variant's text drops below 4.5:1 or a control edge
below 3:1 on its ground, panel or band. Licensed brand faces are replaced by their closest Google Fonts; never copy a
logo or wordmark.

**Change a color, radius or font.** Edit `design-system/tokens.json`. The dev server writes `src/styles/tokens.css` from
it; never edit that file by hand. Every color has a light and a dark value; check text colors against `ground`,
`panel` and `band` for 4.5:1 or better, and control edges for 3:1.

## Check your work

- `npm test` checks every catalog part in every state, the layers, Northlight OS's journey and automations, and every
  variant's contrast.
- `npm run qa`, with the dev server up, takes screenshots of every view and screen in both themes, at 1440 and 390 px,
  a guest action carried through, and every variant on Today, into `qa-out/`. Read them after any visual change. Check that text fits,
  nothing clips, every status color sits beside its word, and each view has at most one band.
