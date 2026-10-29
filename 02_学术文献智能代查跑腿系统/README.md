# 学术文献智能代查跑腿系统 (Academic Express)

[![Web App](https://img.shields.io/badge/Platform-Web_Application-4B32C3?style=flat)](https://github.com)
[![Tailwind CSS](https://img.shields.io/badge/TailwindCSS-38B2AC?style=flat&logo=tailwind-css&logoColor=white)](https://tailwindcss.com/)
[![Architecture](https://img.shields.io/badge/Architecture-Dual_Portal_Isolation-green?style=flat)](https://github.com)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

> 面向全球留学生与科研工作者的自动化文献检索辅助与跑腿服务平台。采用客户前台与站长管理后台「物理级别完全隔离」的双端架构，集成动态阶梯计价、加急工单、激活密钥核销与工单管理系统。

---

## 🌟 核心功能与架构

1. **双站物理隔离设计**
   - **客户端前台 (`academic-client-singlefile.html`)**：极致纯净的客户提交界面，无任何后台入口泄露。
   - **站长管理后台 (`academic-admin-singlefile.html`)**：独立的私密管理看板，实时汇总订单状态、工单详情、待办队列与营收统计。

2. **智能阶梯价格核算引擎**
   - 支持根据中文 / 英文文献、是否有指定 DOI、年份跨度（5年内/3年内/当年）、文献级别（SCI 顶刊/核心/外国作者）等多种复杂维度自动计算准确费用。
   - 包含个性化加急履约选项（25 分钟极速响应保障）。

3. **激活码自动校验与防逃单闭环**
   - 接入订阅制标准的扫码与 Key 激活核销流程，杜绝白嫖漏洞，实现工单安全下达与全流程状态跟踪。

4. **开箱即用与单文件交付**
   - 既提供模块化源码，又编译生成了不依赖外网 CDN 的独立离线单文件版本，适配复杂校园网络与国内直连访问。
