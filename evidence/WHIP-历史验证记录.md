# WHIP 1.2.0 已执行验证 — 2026-10-23（Asia/Kuala_Lumpur）

| 检查 | 本轮实际证据 |
|---|---|
| 严格TypeScript | tsc -b，exit0 |
| 自动测试 | Vitest4文件，58/58通过；最终4.38秒。含旧记录/收藏/目标保留、双品牌备份、所有配方有效性、重量与总能量守恒、未知营养、饮料地区/官方单位换算 |
| 生产构建 | Vite7.3.7，2258模块；16项预缓存约1054KiB；exit0。可选识图WASM约21.6MB独立文件，公开模型另需首次下载 |
| 真实目录 | 菜72/食材104/饮料30；搜索香菇出现生香菇34kcal/100g；中马标签可区分 |
| 可编辑配方 | 家常蛋炒饭380g约533kcal；油改0、成品重量760g、吃380g后222.1kcal，最终确认保存为一条本机测试餐食 |
| 糖块下落 | Red Bull MY250ml=27g=6.75块；实际计算样式有不同下落位移，有限动画完成后有部分方糖。真实截图sugar-falling.png |
| 零与未知 | 东方树叶官方零糖显示0个糖块且没有含糖红旗；中国大陆原味可乐未知时显示横线/待标签，不显示零 |
| 包装编辑 | 修复填写糖量会折叠信息的问题；连续输入成功。合成测试330ml、6.2g/100ml、24.8kcal/100ml得20.46g糖和81.84kcal；不是可乐实测值。负能量时记录按钮禁用 |
| 饮水圆盘 | 点击+250ml，实际记录250ml、目标2000ml，圆盘显示约13% |
| 冲动中断 | 实际等待60秒；计时期间确认禁用，结束后主动确认保存一次抵抗；首页近7天计数从1变2 |
| 严厉红旗 | 测试事件先保存再显示新版行为文案；Esc退出；原有饮食记录仍保留 |
| 尺寸 | 浏览器原生iframe1280×800、1440×900、1920×1080、380×900实际渲染截图；桌面无可见横溢出，1440首屏关键指标可见。iframe负责尺寸，交互在直接应用页操作 |
| 浏览器错误 | 最后读取本地应用错误日志为空 |

真实截图位于docs/whip-1.2/；截图内所有健康记录为合成QA数据，没有用户健康导出进入发布包。使用本机Node直接调用工具，原因是宿主管理pnpm包装器的存储目录配置不同；正常安装仍可用项目pnpm脚本。

## 本轮未验证或延期

未重测全部72类照片匹配准确率；识图worker保留且候选列表扩展，但不能承诺逐菜识别率。真实手机拍照/文件选择器、物理震动与扬声器、Safari安装后图标刷新、屏幕阅读器/正式WCAG认证未实机验证。减少动态静态替代已实现，系统级偏好本轮未切换验证。Supabase仍按用户选择不创建，未模拟真实登录。8款饮料糖和9款能量未知，等待实际包装；无排行或统一跨地区配方声明。下方为前版历史验证，不代表本轮重复执行。

---

# Executed verification — 2026-10-22 (Asia/Kuala_Lumpur)

## Passed

| Check | Actual evidence |
|---|---|
| TypeScript strict compilation | `tsc -b`, exit0 |
| Production build | Vite7.3.7, 2192 modules, Workbox15 precache entries, ~861KiB uncompressed assets |
| Domain + persistence | Vitest3.2.7: 2 files, 41/41 tests passed, final full run1.87s |
| Alternate timezone | `TZ=America/New_York … vitest run tests/domain.test.ts`:32/32 passed |
| Realistic record count | 3650 rows bulk create/export/merge; final workload721ms under fake-indexeddb |
| Empty production database | Dist preview starts with no user entries; reference catalog only |
| One-tap water | Real browser records250ml and timeline entry |
| Food search / calculation | `mifan` finds rice;150g computes195kcal; screenshot `food-portion.png` |
| Browser persistence | Reload retains195kcal rice and250ml water |
| Workout | Start bench press;30kg×12; complete set yields360kg volume; pause/reload retains6s and set; finish appears as one completed session |
| Body / sleep | Save synthetic70kg and23:00→07:00 sleep;8h shown in recent records |
| JSON download | Actual browser download produced a local file; app confirms browser handoff |
| Five pages / themes | Actual phone-width light captures, dark mobile captures,1280×720 desktop dark captures in docs/ |
| Offline production | Serve dist at127.0.0.1:4173; cache reports ready; stop server; reload succeeds; save250ml; navigate all five pages including first lazy Trends load; no captured browser console errors |

Direct Node executables were used on this host because its managed pnpm wrapper attempted dependency reconciliation under a different store. Standard project scripts are provided for normal Node/pnpm installations. Initial installation required network escalation; missing `workbox-window` was corrected. No build warning remains for a monolithic chart bundle after lazy loading.

A repeated year-volume test initially hit the default5s timeout during concurrent builds. After bulk import and cached Intl optimization, the final full suite passed. The volume test now has an explicit15s workload timeout; ordinary tests keep default timeouts.

## Authored but not executed

`e2e/vital.spec.ts` has three Playwright UI scenarios across mobile WebKit and desktop Chromium: real food/water persistence, navigation/goals/empty data, JSON download/dedup restore. This session used the permitted CUA browser workflow for actual interaction. The separate Playwright runner was **not run**, and these authored cases are not counted as passed.

## Unverified / limited

- UI file chooser restore smoke could not complete because the in-app browser did not deliver a filechooser event. Import validation, merge, replace, dedup and rollback logic passed automated IndexedDB tests; real iPhone Files restore still required.
- Physical iPhone Safari install/standalone lifecycle, GPS permission/granted routes, battery, location accuracy and lock-screen interruption have not been executed.
- iOS Simulator unavailable: only Command Line Tools installed, no full Xcode. All captured images are web browser renders.
- VoiceOver, large text, formal contrast/accessibility certification, Safari storage eviction and quota simulation not executed.
- Free Cloudflare/GitHub deployment instructions/configuration delivered; provider-account deployment and domain-specific security/cache headers need actual hosting verification.
- No schema migration is claimed tested: current local and export schema are v1.
- Long-session GPS/photo memory profiling and real iPhone multi-year performance remain pending.

Synthetic QA records exist only in separate localhost browser origins. Production source/dist contains no personal records. Zero fake measurements are seeded by application startup.

## Desktop / accountability update (supersedes old UI scope above)

- Original 41 tests plus 8 new tests pass: **49 / 49**, including sugar scaling, reset-clock dates, duplicate-ID persistence, event backup/restore, atomic invalid import rejection, avatar/weather preference validation, nullable dish nutrition, and malformed weather rejection. Strict TypeScript passed after new worker/auth integration.
- Actual browser: both Red Flag event types saved and rendered correct bilingual overlay; resistance saved with no red overlay and incremented7-day count; recovery preserved existing food/water/body/sleep. Historical records still appear after reload. Screenshots are synthetic QA records only.
- Actual browser: 250g reference char kway teow produced472.5kcal (display473), total668 with old195kcal rice; sugar lab shows35g and8.7 display cubes at330ml/10.6g; these are rounded display values, math tests verify34.98g/8.745.
- Actual browser: profile court avatar saved; city search + current weather returned example Kuala Lumpur27°C, high35/low26 at test time, with source/time. No actual user coordinates used.
- Actual CLIP WebWorker inference executed with publicly available fixture images. Fried rice ranked the corresponding fried rice candidate first (relative score0.2971); a tiger fixture's first candidate was outside food menu, so no food auto-record would occur. `docs/redesign/model-inference-result.json` records the actual food run. This is an execution check, not a recognition accuracy study. Temporary third-party fixtures are removed from publication.
- Desktop sizes use actual browser-rendered iframe1280×800,1440×900,1920×1080, with direct application-tab interaction checks. Screenshots in `docs/redesign/`. 1440 viewport shows daily nutrition, hydration, weather, reset clock, resistance and recent event in first screen. Weather caption overlap found and corrected.
- Actual login/register/reset UI switches verified, unconfigured button disabled. **No real Auth backend provisioned or end-to-end credential test**, per user's explicit defer choice. Device vibration, sound output, camera and operating-system file chooser remain unverified.
- Development Fast Refresh produced duplicate-root warnings during mass formatting; main now unmounts its owned root during HMR disposal. Final production console is checked separately; earlier development logs are not claimed clean.

- System file chooser emitted an event but rejected file assignment (`No node found for given backend id`); no claim of upload/camera end-to-end success. Local model execution used a separate temporary QA page, not the OS picker.

- Final production artifact: Vite2248 modules, Workbox16 precache entries ~934.5KiB; optional867.65KiB model worker,44.48KiB ONNX module,21.60MB WASM excluded from mandatory offline precache. Model weights download only after consent.
- Final dist was served under the actual intended CSP (`script-src self wasm-unsafe-eval`) and Permissions-Policy in a separate local staging copy. Production worker + bundled local ONNX/WASM inferred a public fried-rice fixture successfully; no captured warnings/errors in the empty production Trends page. No QA fixtures or harness pages are included in dist. Production callback/auth integration remains unconfigured.

- Final compatibility correction resolves system theme from matchMedia and updates both CSS theme and theme-color on OS preference changes, preserving the original appearance control. Explicit light remains the white/blue design.

- Actual browser theme check after correction: explicit dark produced computed body RGB(17,18,23); returning to system on the current light OS produced RGB(245,245,247).
