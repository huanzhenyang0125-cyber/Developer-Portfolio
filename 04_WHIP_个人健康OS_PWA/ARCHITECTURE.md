# Architecture

React 19 + strict TypeScript. Vite compiles static assets; Tailwind v4 and CSS tokens provide styling. No API server, account, cloud database or third-party runtime network call.

- `src/App.tsx`: application shell, navigation, live queries, modal routing, first use and PWA update prompt.
- `src/features/`: Today, Nutrition, Activity, Trends (lazy-loaded), Profile; separate food, record and settings forms.
- `src/components/ui.tsx`: accessible buttons/cards/sheets, focus trapping, unsaved changes protection and reduced-motion CSS.
- `src/lib/types.ts`: portable model and defaults.
- `src/lib/domain.ts`: pure arithmetic, local calendar handling, nutrition aggregation, GPS filtering, analytics, export validation.
- `src/lib/db.ts`: Dexie schema v1 and repository boundary. Writes await success; import runs one atomic transaction. Indexed queries available on kind/date; current daily-scale queries use reactive arrays.
- `src/lib/store.ts`: transient Zustand UI state only. Private data stays in IndexedDB.
- `src/lib/catalog.ts`: source-attributed reference foods and exercise definitions.

PWA: vite-plugin-pwa generates Workbox asset precache and manifest. Prompt update prevents unexpected mid-workout reload. Lazy Trends assets are included in precache. No CDN font, map tiles, food API or cloud storage dependency.

GPS: watchPosition only for explicitly active outdoor sessions. Accuracy <=40m; monotonic timestamps; speed ceilings 10m/s walking/running or 25m/s cycling; small-noise rejection. Distances use Haversine only within one pause segment. Hide pauses outdoor sessions; cleanup clears watch. Reload conservatively pauses at latest persisted checkpoint (up to ~15 seconds of elapsed time may be truncated). Route sketch is local and north-up, with no geographic basemap. Foreground GPS is not a battery/medical accuracy guarantee.

Future integration boundaries: read-only source adapters may emit validated Food records; Health/AI adapters must be optional and must request explicit consent before any personal data transmission. Neither stub AI nor simulated Health integration is presented in UI.

Scaling: entries paginate at 50 rows; exercise list is scroll bounded; charts memoize derivations. The tested 3,650-row backup is not a full device performance certification. Route arrays are rewritten per accepted point; long-session chunked route storage is a future migration before high-volume GPS use.
