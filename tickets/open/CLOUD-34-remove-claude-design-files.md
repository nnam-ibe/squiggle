# CLOUD-34: Remove Claude Design files from the repo

**Status:** open  
**Priority:** medium  
**Created:** 2026-06-27  
**Updated:** 2026-06-27  

## Description
We are no longer using the Claude Design handoff as a source of truth. Remove the
design artifacts from the repo and any references that treat them as an active
workflow input. The design tokens are already baked into `globals.css`, so this is
purely cleanup — no visual change intended.

## Scope / files
- Delete `design/` (contains `chats/`, `project/`, `README.md`).
- Delete `DESIGN.md`.
- Drop the `design/` ignore entry in `eslint.config.mjs` (if present).
- Remove "consult the design files / Claude Design" guidance from active docs that
  point at them as a workflow: `PRD.md`, `ROADMAP.md`, `TECHNICAL_DESIGN.md`.
- Leave incidental code comments that merely mention "design default" (e.g. in
  `globals.css`, `Icon.tsx`, `BumpChart.tsx`) — they document intent, not the files.
- Leave historical references inside `tickets/done/*` untouched.

## Acceptance Criteria
- [ ] `design/` and `DESIGN.md` no longer exist in the repo
- [ ] No active config/docs reference the deleted files; `npm run lint` passes
- [ ] App builds and renders unchanged (`npm run build`, spot-check home + a dataset page)

## Notes
The "Squiggle design" auto-memory should also be retired once this lands.
