# 产品要求与范围

最终权威要求：免费、长期个人使用的静态 PWA，React + TypeScript + Vite + Tailwind + Dexie + Zustand + Recharts。旧原生 iOS/Xcode/SwiftData 要求被后续架构修订替代；保留 Apple 风格交互原则。

主要用户路径：打开今日 → 记餐/一键饮水 → 日汇总 → 运动计时或手动记录 → 查看真实趋势 → 定期 JSON 备份。用户不需要登录，健康记录不经过服务器。不植入演示记录。

验收：构建成功、五页可用、CRUD 持久化、真实营养计算、跨夜日期、真实图表、空态、可恢复导出、离线资源缓存、隐私与删除、手机/桌面响应式。定位单列真机验收，不以单元测试替代。

当前实现和验证程度以 TEST_RESULTS.md 与 ROADMAP.md 为准。不能把本轮浏览器测试当作 iPhone 真机验收，也不能把 API 实现当作完整后台 GPS。
