# Actual visual / UX review

Reviewed the working PWA in Codex's in-app browser at a narrow phone-sized viewport. Files in docs/ are actual browser screenshots, not generated mockups. No previous application existed, so “before” means first implementation render, not a preexisting SwiftUI app. No iOS Simulator was available.

Selected references:
- Sites workflow: installed `sites/1.1.1/skills/sites/SKILL.md` supplied by the environment; used for source-backed preparation and publication.
- [Anthropic frontend-design SKILL](https://github.com/anthropics/skills/blob/main/skills/frontend-design/SKILL.md): intentional hierarchy and restrained composition; reviewed before use.
- [Vercel Web Interface Guidelines SKILL](https://github.com/vercel-labs/agent-skills/blob/main/skills/web-design-guidelines/SKILL.md): controls, focus, safe areas, motion and forms. Reviewed current linked command.md.
- [Apple HIG](https://developer.apple.com/design/human-interface-guidelines): transferable mobile navigation and interaction principles; no native SwiftUI/Liquid Glass claim.

## First render → changes

| Finding | Source change | Verification |
|---|---|---|
| Supporting mobile captions too small | 11–13px secondary copy, 14px row labels, native 16px inputs | before/after screenshots |
| No direct mobile arbitrary-date entry | compact native date control next to Today | actual phone layout |
| Small nutrient values rounded to0 | macro totals now retain one decimal | rice fat shows0.4g |
| Generic empty metric risk | dash for unrecorded, data coverage, actionable empty state | real empty screens |
| Single nutrition data point produced tight y-axis | nutrition/fluid/activity start at0; body can auto-scale | chart source and subsequent render |
| Long history would overflow | 50-row pagination | source + realistic data tests |
| Sheet background still interactive | inert background, trap/return focus, close guard | keyboard/API review; VoiceOver pending |
| Energy double-counting ambiguity | explicit food-only energy, activity estimates separate | screen copy and logic tests |

Typography: disciplined display and secondary hierarchy, tabular numbers. Space: nutrition/water have priority, detail scrolls naturally. Color: no rainbow dashboard; three supporting semantic accents. Materials: opaque readable cards, blur only navigation/backdrop. Navigation: five bottom tabs and reachable quick action. Forms: native pickers, explicit units, validation and destructive confirmations. Motion: no ambient animations, reduced-motion CSS. Both themes use semantic tokens.

Remaining review: true iPhone Safari/standalone keyboard and safe areas; VoiceOver/text scaling; real-device touch and contrast audit. Screenshot rendering alone does not certify accessibility or background behavior.

## Final captured matrix

- Mobile light: `today-light.png`, `nutrition-light.png`, `activity-light.png`, `trends-light.png`, `profile-light.png`.
- Mobile dark: `today-dark.png`, `activity-dark.png`, `trends-dark.png`, plus workout and food form captures.
- Desktop dark,1280×720 viewport: all five `*-desktop-dark.png` files. Inspected source layout and actual browser renders.
- `desktop-offline.png`: actual production app after source server stopped and a water record was saved.

Screenshots contain synthetic QA records only. No user's personal health values are represented. Reviewed both actual empty and recorded states. Full-page captures may place fixed navigation at the screenshot edge; viewport captures preserve the actual pinned navigation position.
