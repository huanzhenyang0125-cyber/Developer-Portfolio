# 宦震洋 Ryan Huan

金融科技本科在读，求职方向为 **AI 应用产品实习 / Vibe Coding**。借助 Codex、Claude 等工具，将业务需求整理为页面、数据字段与操作规则，再完成交互原型和运行核验。

[作品集主页](https://huanzhenyang0125-cyber.github.io/Developer-Portfolio/) · [求职简历](https://huanzhenyang0125-cyber.github.io/Developer-Portfolio/portfolio-assets/resume.pdf) · [招聘联系](mailto:huanzhenyang0125@gmail.com)

## 岗位匹配优势

- **金融与财务业务理解**：主修 Financial Technology，辅修 Business Analytics 与 Banking and Financial Management；有商业会计、会计信息系统课程及企业成本费用核对实践。
- **需求到 AI 指令的转化**：围绕角色、字段、计算规则和验收步骤拆解任务，使用自然语言与 AI 编程工具协作，按运行反馈迭代。
- **可运行项目交付**：四个项目覆盖个人财务、健康记录、工业选品和文献服务；保留在线入口与两篇深度案例。
- **核验与学习习惯**：自学 Python 等工具，关注数据口径、保存逻辑及边界状态；区分演示数据、既有测试和未实测结论。

## 深度案例

| 项目 | 复盘重点 | 查看 |
| --- | --- | --- |
| 极简财富 Pro | 财务信息层级、Canvas 圆环几何与命中判断、localStorage 的取舍 | [深度案例](https://huanzhenyang0125-cyber.github.io/Developer-Portfolio/case-studies/wealth-pro.html) · [运行原型](https://wealth-pro-ehw.pages.dev) |
| WHIP 个人健康 OS | 空白状态、SVG 进度、IndexedDB 事务、PWA 与恢复边界 | [深度案例](https://huanzhenyang0125-cyber.github.io/Developer-Portfolio/case-studies/whip.html) · [体验应用](https://whip-health.pages.dev) |

## 其他项目

| 项目 | 业务任务 | 查看 |
| --- | --- | --- |
| 奥尼斯工具工业门户 | 按材料和规格组织产品选型，衔接意向清单与询价 | [在线项目](https://honest-tools.pages.dev) |
| 学术文献代查系统 | DOI / 关键词提交、动态计价与客户 / 管理双端流程 | [客户前台](https://academic-express.pages.dev) · [管理端](https://academic-express.pages.dev/admin.html) |

## 实现与验证范围

项目以个人实践和 AI 辅助开发为主。财富 Pro 是 HTML / JavaScript 交互原型，账户状态使用 localStorage；WHIP 使用 React / TypeScript、Dexie / IndexedDB 与 PWA 配置。

财务金额、曲线和案例交互使用演示或合成数据，不代表真实投资业绩。WHIP 案例中的既有测试结果标注了记录日期，并区分本轮核对与待实测事项；不将本地保存表述为加密或自动跨设备同步。

## 本地查看

在仓库根目录启动静态服务器后打开首页：

```bash
python3 -m http.server 8000
```

首页为 `index.html`，深度案例位于 `case-studies/`，作品集样式、脚本和简历位于 `portfolio-assets/`。
