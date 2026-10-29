# VITAL design system

方向：安静的个人健康记录空间。重要的是当天可操作的信息，不是营销落地页，也不展示虚构健康评分。

| Token | Dark | Light |
|---|---|---|
| Background | #0B1418 | #F4F7F6 |
| Surface | #131F24 | #FFFFFF |
| Elevated | #1A292E | #EEF4F1 |
| Text | #EFF5F4 | #1B302E |
| Secondary | #95AAAE | #647A77 |
| Mint action | #84DDC1 | #237F68 |
| Blue | #9ABFE7 | #4379A8 |
| Warm nutrition | #E5B99B | #A2623E |
| Sleep lilac | #BDAFE1 | #7B63A4 |

System font stack: SF/PingFang on Apple, platform fallbacks elsewhere. Tabular numerals for changing values. Mobile display 28px; primary form values 16px (avoids iOS automatic input zoom); primary record rows 14px; supporting mobile copy 11–13px. Long strings wrap or truncate responsibly.

Layout: desktop 226px fixed rail + content capped at 1340px; mobile breakpoint 760px. Today prioritizes nutrition, hydration, four simple daily metrics, timeline, then traceable observations. 20–24px page spacing, 12–20px grid gaps, 18–20px cards, 12px controls. Distinct density for forms vs summaries.

Glass is limited to the bottom navigation and modal backdrop. It is a CSS material approximation, not Apple's native Liquid Glass API. Cards stay opaque for contrast. Selected dates use solid mint; food/water/sleep accent colors remain restrained. App icon is a local vector V/leaf, with PNG installation assets.

Interactions: thumb-reachable quick add, native date/select/file controls, bottom sheets, timestamp workout timer, confirmation before destructive actions, focus return/trap, inert background, visible keyboard focus. Dynamic text reflows, no maximum-scale restriction. Animations are short and user triggered; Reduce Motion disables them.
