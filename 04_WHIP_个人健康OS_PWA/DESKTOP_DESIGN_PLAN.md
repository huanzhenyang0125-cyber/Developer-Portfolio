# Desktop refinement plan — 2026-10-22

User priority: Apple HIG restraint, white and blue, practical daily companion rather than an administrative dashboard. Existing nutrition, training, dates, calculations, data and backup behavior stay intact. Explicit additions: local avatar choice, basketball/badminton quick starts, optional live weather, desktop delivery.

## Tokens (before implementation)

- Background #F5F5F7 with one white-to-cool-gray large radial light. Text #1D1D1F; secondary #6E6E73; tertiary #A1A1A6 (decorative/disabled only); divider black at8%.
- Sole accent #0071E3; hover #0077ED; pressed #006EDB. Blue tints and neutral gray only. Dark appearance remains available with blue accents; system/light desktop is white-dominant.
- System SF/PingFang stack. Page32/600; large metric48/600 (40–56 range); card15/500; body15/400; captions12–13. Tabular numbers and -0.02em for metrics.
- 8px base spacing:8/16/24/32/40/48.12-column content grid,24px gap,1280px maximum.64px sticky top navigation; no desktop sidebar. Quiet date rail and top-level page title. Nutrition is largest; weather and water balance the right column; daily measures share a single calm strip.
- Cards24px radius; controls12px or pill,40px minimum desktop and44px touch. Surface rgba(255,255,255,.72), blur24px saturate160%, white80% hairline plus black6% outline. Shadow0 8px30px black6% and0 2px8px black2%. Floating surfaces32px blur and stronger but soft shadow. Solid fallback where blur is unsupported.
- Motion220ms ease-out,2px hover lift for actionable cards, one-time subtle numeric reveal and chart draw. Reduced motion disables effects. Loading skeletons and hover tooltips have accessible text equivalents.

## Guardrails

Do not seed data or change nutrition/goal/workout calculations. Optional avatar and weather preference fields are backward-compatible and do not change IndexedDB indexes. Validate optional fields during restore. Weather sends only chosen city coordinates to Open-Meteo after user action, caches15min, refreshes30min while foreground; no health data transmission. City choice required, never infer city from timezone. Basketball and badminton reuse existing cardio timer and history.

## References / skills

Requested frontend-design, ui-ux-pro-max, apple-hig-designer are not locally installed after catalog and filesystem inspection. Continue with installed Sites workflow and the user's precise token specification; existing verified frontend guidance is subordinate to Apple restraint. Consulted Apple HIG layout and official Open-Meteo forecast/geocoding/terms. No skill installer or third-party script executed.

## Verification

Run existing domain/persistence tests and production build; add meaningful avatar-import/weather parsing tests. Render actual UI at1280,1440,1920px, inspect overflow/alignment/contrast and all five screens. Preserve mobile navigation. Update same public Site without audience change. Save portable static/source ZIP and a .webloc launcher to Desktop at the user's explicit request.

## Explicit additions accepted during this turn

Red Flag uses one temporary near-black/red #D71920 alert layer with fixed bilingual copy, finite optional feedback and accessible exit. Normal success stays blue. Auth remains optional and unconfigured per final user choice. Cooked-food references, local CLIP matching, editable sugar balance and real event records use existing storage; no photo upload or server health store. See REQUIREMENTS_CHECKLIST.md.
