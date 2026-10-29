# WHIP 1.2.0 — 2026-10-23

- 品牌、启动画面、PWA安装名和图标统一为WHIP，新增蓝色W标志。旧IndexedDB名称、记录ID、v1结构和网站域名保留；新备份标记WHIP，旧VITAL备份仍可导入。
- 菜品目录72项：12项原参考/自行估算菜品，60项可编辑配方示例。食材104项：原16项保留，新增88项USDA SR Legacy原始数据。食材克数、成品假设重量、实际吃下份量分别明确，未知营养不当零。
- 中马30款饮料：马来西亚18、中国大陆12。22款可核验总糖/官方零糖声明；8款总糖留空待核对；21款有能量。地区、来源、每100ml基准和容量假设随卡片展示。
- 糖块实际下落与落地回弹、部分方糖、重播、天平切换；每块4g仅作展示单位，有限动画，减少动态时静态显示。查看或播放动画不会记入摄入。
- 饮水改为蓝色圆盘；沿用真实记录和目标计算。新增自愿的冲动/熬夜60秒中断练习，结束后主动确认成功；严厉提醒针对行为和用户自己的规则。
- 登录服务仍按用户要求暂不创建，照片识别仍是设备内候选匹配，需要人工确认菜品和份量。


# Desktop and daily-choice update — 2026-10-22

White/blue glass top navigation; local avatar; opt-in Open-Meteo weather; basketball/badminton starts; cooked dish library; local CLIP candidate recognition; sugar balance visualization; persisted accountability events and Red Flag overlay; optional Supabase Auth wiring (unconfigured by user choice). Existing IndexedDB indexes and nutrition/workout calculations preserved. 49 passing tests; current limits documented.

# Changelog

## 1.0.0 — 2026-10-22

- Created the static React/TypeScript PWA from an empty workspace following final architecture revision.
- Added actual persistent daily records, food catalog/portions/recipes/templates, fluid tracking, 102 exercises, live workouts, foreground GPS, body and lifestyle forms, charts and traceable insights.
- Added transactional validated JSON restore, CSV export, storage warnings and deletion.
- Added light/dark responsive interface, Chinese-first copy, English navigation, local app icons, service worker and installation instructions.
- Added automated domain and IndexedDB tests, real browser smoke evidence and visual captures.
- Refined small mobile supporting text, numeric precision, missing-value handling, route pause boundaries, focus/unsaved controls and long-list pagination following review.
