# Implementation notes — Limit Explorer

Developer-facing architecture notes for `limit-explorer`.

## Architecture

Screens: src/approach/, src/epsilon-delta/

- Models own state and `step` / `reset`; views observe Properties and never integrate physics.
- Colors live in `src/LimitExplorerColors.ts`; strings in `src/i18n/` via `StringManager`.
- Preferences shell: `src/preferences/` (empty until sim-specific prefs are added).

## Notes

*Record design decisions, performance constraints, and known limitations here.*
