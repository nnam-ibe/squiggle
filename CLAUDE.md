@AGENTS.md

## Tickets
Active tickets live in `tickets/`. Use these paths:
- Open: `tickets/open/`
- In progress: `tickets/in-progress/`
- Done: `tickets/done/`

When starting work on a ticket, reference it with `@tickets/in-progress/<filename>.md`.
When completing a ticket, move it to `tickets/done/` and update its status.

## Git workflow (per ticket)

Never work directly on `main` (a PreToolUse hook in `.claude/settings.json`
hard-blocks `git commit`/`git push` while on `main`). For every ticket:

1. **Before starting**, branch off an up-to-date `main`:
   `git checkout main && git pull && git checkout -b ticket/CLOUD-<n>-<slug>`
   (e.g. `ticket/CLOUD-21-f1-adapter`).
2. Move the ticket file to `tickets/in-progress/` and set its status.
3. Do the work in commits scoped to that ticket.
4. **When done**, ensure `npm run typecheck`, `npm run lint`, and `npm test`
   pass; move the ticket to `tickets/done/` (check its acceptance criteria);
   commit; then **push the branch**: `git push -u origin HEAD`.

CI (`.github/workflows/ci.yml`) runs typecheck + lint + tests on every push and
PR. Open a PR only when asked (requires `gh auth login`).
