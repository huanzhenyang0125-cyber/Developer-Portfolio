# VITAL contributor instructions

The final architecture is a static React/TypeScript PWA. Do not reintroduce SwiftUI, native signing, server health databases, required login, paid APIs, trackers or cloud sync. The native-iOS paragraphs in the original brief are superseded by its final architecture update.

- Store personal records only in Dexie/IndexedDB. Never commit real health exports, photos or coordinates. UI test records and screenshots are explicitly synthetic.
- Keep unknown nutrients nullable. No silent calorie allowances from workouts. Show estimates and source identifiers.
- Validate writes and all imported fields. Import must be transactional, merge must skip existing IDs, replacement requires explicit confirmation.
- Bump Dexie schema versions with a migration; never delete a database to repair an upgrade.
- GPS is explicit, foreground-only, with accuracy/speed filtering, paused segments, and cleanup. Do not claim background tracking.
- Use `pnpm test` and `pnpm build`. Test math, dates, persistence and recovery. Capture real screenshots for visual changes; do not describe generated mockups as app captures.
- Native browser controls, accessible labels, keyboard focus, reduced motion and safe-area padding are required. Keep primary mobile controls >=44px.
- Document implemented, deferred, blocked and unverified separately in TEST_RESULTS.md / ROADMAP.md.
- Keep deployments source-backed. Do not alter the audience of an existing Site without authorization.
