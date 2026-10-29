# Test plan

Automated: `pnpm test`, then `pnpm build`. Domain suite checks scaling, missing values, meal totals, recipe yield, CSV, import validation, dates, sleep, GPS/pauses, volume, insight coverage. IndexedDB suite uses fake-indexeddb, not a substitute for browser persistence. Re-run date tests under multiple TZ values.

Browser smoke: empty first use; five tabs; one-tap water; pinyin food search; portion 150g rice =195kcal; persist after reload; edit/delete; custom food; recipe; body/sleep; invalid input; workout start/sets/pause/reload/finish; targets; JSON export/restore; dark/light screenshots. Use only synthetic records in QA origins. Do not commit real exports.

Production PWA: serve built dist on a separate origin, wait for cache ready, stop server and reload to exercise actual offline cache. Validate manifest icons/scope and lazy route cache. Hosted auth caches can differ; do not assume preview behavior equals iPhone standalone.

Physical iPhone checklist (unverified until executed): Safari add to Home Screen, safe areas and keyboard, offline launch after force quit, JSON Files save/restore in standalone, denied/granted GPS, route accuracy walking/running/cycling, pause on background/lock, voiceover navigation, text size, 30–60min battery, storage eviction/recovery. No reliable background GPS acceptance target.

Performance: 3650 synthetic daily records through create/export/import and long-list pagination. Real-device route/photo memory profiling and multi-year large-dataset benchmarks remain separate.
