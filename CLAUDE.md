# CLAUDE.md

Guidance for Claude Code in this template. Read `README.md` first.

## Local dev

- The app runs at http://localhost:5182 (`npm run dev`; `vite preview` uses the same port). `vite.config.ts` pins it with `strictPort`, so a busy port is an error, never a move to the next one. The API proxy targets http://localhost:8787 (`npm run dev:full` runs the Pages Functions and D1 beside the app).
- `npm run qa` (with the dev server up) writes screenshots of every view and screen in both themes, at 1440 and 390 px, a guest action carried through, and every design variant, to `qa-out/`. Northlight OS runs on its own example data, so it needs no database. Read the images after any visual change.
- The app needs `VITE_APP_NAME` at startup (see `.env.example`); without it the page renders blank.

## Northlight OS (this branch)

On `design/modern` the app is Northlight OS, a living prototype built from two iii.partners discovery documents for Northlight (confidential, October 2026). Read `src/os/README.md` first. The documents' data is in `src/os/blueprint.ts` and `src/os/flow.json`; the living state, actions and automations are in `src/os/store.ts`; the guests are invented example data.

## The design system

Read `design-system/README.md` before you build anything. It holds the rules, the parts, and recipes for adding a main
view, a screen or a part. Every part, with its four states (happy path, empty, loading, error), is in the catalog
(`src/design/catalog.tsx`) and on the Design system screen. `design-system/tokens.json` is the source of the theme;
`scripts/tokens.ts` writes `src/styles/tokens.css` from it on every dev start and save. Never edit `tokens.css` by hand.

Write copy in US English, plain and active. Keep proper nouns and acronyms in their case.
