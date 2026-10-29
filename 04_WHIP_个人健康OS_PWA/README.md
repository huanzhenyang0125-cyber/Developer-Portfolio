# WHIP · Personal Health OS

一个本地优先、可离线使用的个人健康 PWA。**最终采用 Web App 架构**，无需 Apple Developer Program、App Store、定期签名或付费 API。中文为完整界面；英文导航已预留。

## 运行与构建

需要 Node.js >=22.12，pnpm 11.25.0。

```sh
pnpm install --frozen-lockfile
pnpm dev
pnpm test
pnpm build
pnpm preview
```

开发网址以终端输出为准。`dist/` 是纯静态发布包。不要直接双击 index.html：Service Worker、模块和定位需要 HTTP(S)。`localhost` 仅用于本机测试。

## 当前功能

- 五页导航：今日、饮食、运动、趋势、我的；手机底部导航，桌面顶部玻璃导航；明暗/系统主题。
- IndexedDB 持久化；空白开始，无假健康数据；日期切换与时间线；记录编辑/删除。
- 104 个附 USDA SR Legacy 标识的通用参考食材；中英/有限拼音检索、最近/常吃/收藏；自建标签/估算食物；g/ml 与食物专属份量；未知营养不归零。
- 实时份量计算；餐次；复制昨天；复制记录；当天餐食模板；食材级食谱、成品重量与分份。
- 一键/自定义饮水、ml/fl oz 输入；总液体与白水分列；可配置快捷量。
- 102 个中英动作资料；训练开始/暂停/继续/完成；组、次数、负重、休息信息；训练量、最大负重记录、可复用模板。
- 前台 Web Geolocation、准确度与跳点过滤、分段路线示意、距离/配速、本地保存。锁屏/切后台暂停，返回需手动继续。
- 体重、腰围、体脂、跨夜睡眠、心情/精力、补剂、每日习惯、压缩进展照片。
- 7/30/90 天及自定义趋势，真实数据图表、均值、中位数、移动平均、覆盖率、前后半期比较；事实性睡眠/运动洞察。
- 完整 JSON 导出/校验恢复、去重合并/确认替换；CSV 摘要；永久删除；持久储存申请；储存失败不假装成功。

## WHIP 1.2.0 本轮升级

72道菜、104种食材和中马30款饮料；可编辑配方；有限糖块掉落；蓝色饮水圆盘；主动60秒中断。来源与未知值见 FOOD_SOURCES.md，更新验证见 TEST_RESULTS.md。

白蓝 Apple 风格桌面、头像、篮球/羽毛球计时、可选实时天气、熟食菜品菜单、设备内拍照辅助识别、方糖天平、自律记录与确认后红旗提醒。逐项状态见 REQUIREMENTS_CHECKLIST.md。

登录/注册/密码恢复界面及 Supabase Auth 接入代码已完成；按用户最后选择不创建项目，正式包未配置身份服务。使用不要求登录。将来连接见 AUTH_SETUP.md。健康记录仍只在设备，不会随账户同步。

本地识别需用户同意后首次下载公开模型；照片不上传。照片只帮助匹配菜品，实际克数与营养仍需确认。天气需先选择城市；只有天气城市坐标发送给 Open-Meteo。

## 免费 HTTPS 部署（推荐长期使用）

应用不需要服务器或应用账户。托管方账户只用于部署网站，访客无需注册。托管商的免费计划和政策可能变化，不承诺第三方永久免费。

### Cloudflare Pages

1. 本机构建 `pnpm build`。
2. 在 Cloudflare 账户中选择 Workers & Pages → Create → Pages → Direct Upload（产品入口可能随平台调整）。
3. 上传 **dist 的内容**，或将内容打包为 ZIP 后上传，使用免费 `*.pages.dev` 地址即可。
4. Git 集成时构建命令为 `pnpm build`、输出目录 `dist`、Node 22；无需环境变量、数据库或 API 密钥。
5. `_headers` 提供 CSP 和权限限制；需在正式站点核验托管商确实应用了这些头。

[Cloudflare 静态直接上传说明](https://developers.cloudflare.com/pages/get-started/direct-upload/)

### GitHub Pages

将源码放入自己的 GitHub 仓库。仓库 Settings → Pages → Source 选择 GitHub Actions。已附 `.github/workflows/pages.yml`，推送到 main 后测试、构建并发布。免费方案的仓库可见性限制以 GitHub 当时政策为准。Vite 使用相对 base，支持仓库子路径。

[GitHub Pages Actions 部署说明](https://docs.github.com/en/pages/getting-started-with-github-pages/using-custom-workflows-with-github-pages)

Sites 在线预览为另一个可选分发渠道；其站点访问策略独立于应用。本仓库的无登录静态版本不依赖 Sites 或 ChatGPT 账户。

## 在 iPhone 安装

1. 用 Safari 打开正式 HTTPS 网址。
2. 分享 → 添加到主屏幕；如果显示「作为 Web App 打开」，启用它。
3. 从主屏幕打开，等待显示「离线已就绪」，再测试飞行模式下记录。
4. 固定使用同一网址与同一主屏幕入口。安装版与 Safari 的储存可能独立。

[Apple Safari 主屏幕说明](https://support.apple.com/guide/iphone/bookmark-a-website-iph42ab2f3a7/ios)

## 备份与恢复

「我的 → 备份与恢复 → 导出完整 JSON」。确认文件保存到 Files，再单独保留一份。换设备/域名/浏览器前必须备份。恢复先校验，再选择合并或替换；合并按稳定 ID 跳过重复项并保留当前设置。JSON 含照片与 GPS，CSV 只含扁平摘要、不能用于完整恢复。

浏览器储存不是永久保险箱。清除网站数据、储存回收或卸载主屏幕 App 可能使记录丢失。`navigator.storage.persist()` 是申请，不保证批准。不使用无痕模式。

## 已知边界

完整英文翻译、Face ID 锁、通知、计步/心率导入、专业地图底图、条码/食物照片识别、AI、HealthKit 与 Watch 未实现。GPS 真机精度、Safari 安装与离线恢复、VoiceOver 与长时间电池表现仍须 iPhone 验收。无可靠后台定位。补剂频率、复杂自定义身体围度与食谱编辑器仍待扩展。不是医疗设备。

检查实际执行证据：[TEST_RESULTS.md](TEST_RESULTS.md)，界面复查：[DESIGN_REVIEW.md](DESIGN_REVIEW.md)，完整边界：[ROADMAP.md](ROADMAP.md)。

## 可复现 UI 回归（本轮未运行独立 runner）

```sh
pnpm exec playwright install chromium webkit
pnpm build
pnpm test:ui
```

覆盖手机 WebKit 与桌面 Chromium 的三个场景。当前实际浏览器验证采用 CUA；独立 Playwright suite 仅已编写，不计入已通过41项自动测试。
